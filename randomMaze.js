/* 
    Template : randomMaze.js
    Description : this template provides a solution to randomly generate a maze.
    Author : Yuan Yao (Dylan)
    Version : 1.0
    Created Time : 2016-12-28
*/

"use strict";

/* ====================
    Global Variables
==================== */
const X = Math.floor(Math.random()*45 + 15),            // number of cells in x-axis (horizontally)
      Y = Math.floor(Math.random()*15 + 15);            // number of cells in y-axis (vertically)

const CELL_SIZE = 20,                                   // single-cell width and height
      BORDER = 2,                                       // thickness of grid-line
      WIDTH = CELL_SIZE * X + BORDER,                   // canvas width
      HEIGHT = CELL_SIZE * Y + BORDER;                  // canvas height

const CELLS = [];                                       // save the status of cells: 'visited' | 'unvisited'

const rootX = Math.floor(Math.random() * X),            // the random x-coordinate of the 'starter' cell
      rootY = Math.floor(Math.random() * Y);            // the random y-coordinate of the 'starter' cell

const CANVAS = document.getElementById("maze"),         // the main <canvas>
      CTX = CANVAS.getContext("2d"),                    // used to draw things on the canvas
      BG_COLOR = '#222',                                // color of the maze
      GRID_COLOR = BG_COLOR,                            // color of the 'wall' in the maze
      CELL_COLOR = 'darkGray',                          // color of the visited cells
      BACKTRACK_COLOR = 'white',                        // color of the cells/path after backtracking
      TIMER = 40;                                       // the speed of the program - the bigger, the slower

let currentX = rootX,                                   // always be the current cell's y-coordinate
    currentY = rootY,                                   // always be the current cell's y-coordinate
    auto;                                               // used to start/clear the setInterval() event

const btn = document.getElementById('generate'),        // start button to generate maze
      finish = document.getElementById('finish'),       // program finished
      intro = document.getElementById('config'),        // the simple intro text
      myCanvas = document.getElementById('canvas');     // the section containing canvas


/* ===================================
    Helper class - Stack
    
    It will be used to store the cells 
    during traversing, and backtrack 
    when DFS reaching an end. 
=================================== */
class Stack {
    constructor() {
        this.items = [];
    }
    // add new element to the stack
    push(element) {
        this.items.push(element);
    }
    // delete the last element in the stack
    pop() {
        return this.items.pop();
    }
    // get the last/top element
    peek() {
        return this.items[this.items.length-1];
    }
    // judge if the stack is empty
    isEmpty() {
        return this.items.length === 0;
    }
    // get the number of elements
    size() {
        return this.items.length;
    }
    // clear the stack
    clear() {
        this.items = [];
    }
    // output all the elements in the stack
    print() {
        console.log(this.items.toString());
    }
}

// save all visited cells for backtracking later
const TRACKER = new Stack();


/* =========================
    Visual Controllers
========================= */
function drawingCanvas () {
    // draw the netlines
    drawingGrids();
    
    // set the root cell
    updateCurrentCell(currentX, currentY, false);
    
    // automate the program
    auto = setInterval(function() { stepOut(currentX, currentY); }, TIMER);
}

function drawingGrids () {
    for (let x = 0; x <= WIDTH; x += CELL_SIZE) {
        CTX.moveTo(x + BORDER/2, 0);
        CTX.lineTo(x + BORDER/2, HEIGHT);
    }
    for (let y = 0; y <= HEIGHT; y += CELL_SIZE) {
        CTX.moveTo(0, y + BORDER/2);
        CTX.lineTo(WIDTH, y + BORDER/2);
    }
    CTX.lineWidth = BORDER;
    CTX.strokeStyle = GRID_COLOR;
    CTX.stroke();
}

function drawingRect (cx, cy, color){
    // calculate the real position of cell
    let posX = findCellPosition(cx),
        posY = findCellPosition(cy);
    
    // draw a cell in a certain position
    CTX.fillStyle = color;
    CTX.fillRect(posX, posY, CELL_SIZE - BORDER, CELL_SIZE - BORDER);
}

function drawingLine (fromX, fromY, toX, toY, color) {
    CTX.beginPath();
    CTX.moveTo(fromX, fromY);
    CTX.lineTo(toX, toY);
    CTX.strokeStyle = color;
    CTX.stroke();
}


/* ==============================
    Process Controllers
============================== */
function start () {
    // set up the storage of the cells
    setupCells();
    
    // set up canvas
    setupCanvas(WIDTH, HEIGHT, BG_COLOR);
    
    // drawing the canvas
    drawingCanvas();
}

function setupCanvas (width, height, bgColor) {
    CANVAS.width = width;
    CANVAS.height = height;
    CANVAS.style.backgroundColor = bgColor;
}

function setupCells () {
    /* 
        Initialize the CELLS array, set all to 'unvisited'
    */
    for (let x=0; x<X; x++) {
        for (let y=0; y<Y; y++) {
            CELLS.push('unvisited');
        }
    }
}

function findCellPosition (pos) {
    /* 
        Change the number of X/Y to the real positon.
        Notice: the result is the top-left point of a cell.
    */
    return pos * CELL_SIZE + BORDER;
}

function checkValidation (posX, posY) {
    /*
        This functon checks the status of a given position. 
        A position has exactly one of the three statuses: 
        'visited', 'unvisited' and 'null' (outside the maze)
    */
    let withinMaze = posX >= 0 && posX < X && posY >=0 && posY < Y;
    
    if (withinMaze) {
        // again use the unique index to locate the cell
        let index = Y*posX + posY,
            ifVisited = CELLS[index] === "unvisited";
        
        if (ifVisited) return 'unvisited';
        else return 'visited';
        
    } else return null;
}

function neighborType (posX, posY) {
    /*
        Find the type of neighbors of the given position, 
        in the direction of left, right, up and down.
    */
    let left = {
            x: posX-1, 
            y: posY,
            value: checkValidation(posX-1, posY)
        },
        right = {
            x: posX+1,
            y: posY,
            value: checkValidation(posX+1, posY)
        },
        up = {
            x: posX, 
            y: posY-1,
            value: checkValidation(posX, posY-1)
        },
        down = {
            x: posX, 
            y: posY+1,
            value: checkValidation(posX, posY+1)
        };
    // return the neighbor positions' data
    return [left, right, up, down];
}

function findValidNeighbor (posX, posY) {
    /*
        Find if the given cell has an unvisited neighbor
    */
    let neighbors = neighborType(posX, posY),
        next = {
            visited: [],
            unvisited: []
        };
    
    for (let n of neighbors) {
        if (n.value === 'visited') {
            next.visited.push(n);
        } else if (n.value === 'unvisited') {
            next.unvisited.push(n);
        }
    }
    // pass out the result
    return next;
}

function findTheWall (curX, curY, nextX, nextY) {
    /*
        Find the wall between current cell and next cell -
        it's actually a line segment from point (fromX, fromY)
        to point (toX, toY).
    */
    let fromX, toX, fromY, toY;
    
    // horizontal line
    if (curX === nextX) {
        fromX = findCellPosition(curX);
        toX = fromX + CELL_SIZE - BORDER;
        fromY = toY = findCellPosition(curY > nextY ? curY : nextY) - BORDER/2;
    } 
    // vertical line
    else if (curY === nextY) {
        fromX = toX = findCellPosition(curX > nextX ? curX : nextX) - BORDER/2;
        fromY = findCellPosition(curY);
        toY = fromY + CELL_SIZE - BORDER;
    } 
    // catch an error
    else { throw ('How did it move just now?'); }
    
    return [fromX, fromY, toX, toY];
}

function removeTheWall (curX, curY, nextX, nextY, ifBacktracking) {
    /*
        Remove the wall between current cell and next cell -
        print the line segment with a different color
    */
    let line = findTheWall(curX, curY, nextX, nextY),
        fromX = line[0],
        fromY = line[1],
        toX = line[2],
        toY = line[3],
        color = ifBacktracking ? BACKTRACK_COLOR : CELL_COLOR;
    
    drawingLine(fromX, fromY, toX, toY, color);
}

function moveToNext (nextX, nextY, ifBacktracking) {
    // remove the 'wall' between current and next cell
    removeTheWall(currentX, currentY, nextX, nextY, ifBacktracking);
    
    // reset the 'current' position
    currentX = nextX;
    currentY = nextY;
    
    // visite and update the new 'current' cell
    updateCurrentCell(currentX, currentY, ifBacktracking);
}

function updateCurrentCell (posX, posY, ifBacktracking) {
    // if it's backtracking, use a different color
    let color = ifBacktracking ? BACKTRACK_COLOR : CELL_COLOR;
    
    // visually re-draw the cell
    drawingRect(posX, posY, color);
    
    // if current is first-time visit, meaning not backtracking
    if (!ifBacktracking) {
        // update the cell's type
        CELLS[Y*posX + posY] = 'visited';

        // push into stack
        TRACKER.push(Y*posX + posY);
    }
}

function backTrack (visitedCells) {
    // redraw the current cell
    updateCurrentCell(currentX, currentY, true);
    // remove the last element (current) from stack
    TRACKER.pop();
    
    // find the cell to backtrack
    for (let v of visitedCells) {
        if (TRACKER.peek() === Y*v.x + v.y) {
            // backtracking
            moveToNext(v.x, v.y, true);
            // backtracking over
            return;
        }
    }
}

function stepOut (posX, posY) {
    /*
        Make a single step out
    */
    let nextStep = findValidNeighbor(posX, posY),
        ifBacktracking = nextStep.unvisited.length === 0;
    
    // if the current position has at least one 'unvisited' neighbor
    if (!ifBacktracking) {
        // random a direction!
        let index = Math.floor(Math.random() * nextStep.unvisited.length),
            direction = nextStep.unvisited[index].dir,
            nextX = nextStep.unvisited[index].x,
            nextY = nextStep.unvisited[index].y;
        
        // move to next cell
        moveToNext(nextX, nextY, ifBacktracking);
    } 
    // backtracking
    else {
        // backtrack when stack not empty
        if (TRACKER.size() > 0) { backTrack(nextStep.visited); } 
        // else, means the program reaches the end
        else {
            // clear interval when stack is empty
            clearInterval(auto);
            // hint
            finish.style.display = 'block';
        }
    }
}


/* ===============
    Start up
=============== */
btn.addEventListener('click', function() {
    intro.style.display = 'none';
    myCanvas.style.display = 'block';
    start();
});
