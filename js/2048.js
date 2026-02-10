/**
 * 2048.js
 * 2048 Game Logic
 */

let canvas, ctx;
let grid = [];
let size = 4;
let tileWidth = 100;
let gap = 10;
let score = 0;

function init() {
    canvas = document.getElementById("canvas");
    canvas.width = size * tileWidth + (size + 1) * gap;
    canvas.height = size * tileWidth + (size + 1) * gap;
    ctx = canvas.getContext("2d");

    grid = [
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
    ];
    score = 0;

    addNumber();
    addNumber();
    draw();
}

function addNumber() {
    let options = [];
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            if (grid[r][c] === 0) {
                options.push({ r, c });
            }
        }
    }
    if (options.length > 0) {
        let spot = options[Math.floor(Math.random() * options.length)];
        grid[spot.r][spot.c] = Math.random() > 0.9 ? 4 : 2;
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            let val = grid[r][c];
            let x = c * tileWidth + (c + 1) * gap;
            let y = r * tileWidth + (r + 1) * gap;

            ctx.fillStyle = getTileColor(val);
            ctx.fillRect(x, y, tileWidth, tileWidth);

            if (val !== 0) {
                ctx.fillStyle = val > 4 ? "#f9f6f2" : "#776e65";
                ctx.font = "bold 40px Arial";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText(val, x + tileWidth / 2, y + tileWidth / 2);
            }
        }
    }
    document.getElementById("score").innerText = score;
}

function getTileColor(val) {
    switch (val) {
        case 0: return "#cdc1b4";
        case 2: return "#eee4da";
        case 4: return "#ede0c8";
        case 8: return "#f2b179";
        case 16: return "#f59563";
        case 32: return "#f67c5f";
        case 64: return "#f65e3b";
        case 128: return "#edcf72";
        default: return "#edc22e";
    }
}

document.addEventListener("keydown", function (e) {
    let moved = false;
    // VERY simplified logic for brevity (Usually needs separate slide/combine steps)
    // Implementing proper 2048 logic requires significant code, doing a basic slide version here.
    if (e.key === "ArrowLeft") moved = slideLeft();
    if (e.key === "ArrowRight") moved = slideRight();
    if (e.key === "ArrowUp") moved = slideUp();
    if (e.key === "ArrowDown") moved = slideDown();

    if (moved) {
        addNumber();
        draw();
    }
});

function slide(row) {
    let arr = row.filter(val => val);
    let missing = size - arr.length;
    let zeros = Array(missing).fill(0);
    arr = arr.concat(zeros);

    for (let i = 0; i < size - 1; i++) {
        if (arr[i] !== 0 && arr[i] === arr[i + 1]) {
            arr[i] *= 2;
            arr[i + 1] = 0;
            score += arr[i];
        }
    }

    arr = arr.filter(val => val);
    missing = size - arr.length;
    zeros = Array(missing).fill(0);
    arr = arr.concat(zeros);
    return arr;
}

function slideLeft() {
    let moved = false;
    for (let i = 0; i < size; i++) {
        let old = grid[i].slice();
        grid[i] = slide(grid[i]);
        if (JSON.stringify(old) !== JSON.stringify(grid[i])) moved = true;
    }
    return moved;
}

function slideRight() {
    let moved = false;
    for (let i = 0; i < size; i++) {
        let old = grid[i].slice();
        grid[i].reverse();
        grid[i] = slide(grid[i]);
        grid[i].reverse();
        if (JSON.stringify(old) !== JSON.stringify(grid[i])) moved = true;
    }
    return moved;
}

function slideUp() {
    let moved = false;
    for (let i = 0; i < size; i++) {
        let row = [grid[0][i], grid[1][i], grid[2][i], grid[3][i]];
        let old = row.slice();
        row = slide(row);
        for (let j = 0; j < size; j++) grid[j][i] = row[j];
        if (JSON.stringify(old) !== JSON.stringify(row)) moved = true;
    }
    return moved;
}

function slideDown() {
    let moved = false;
    for (let i = 0; i < size; i++) {
        let row = [grid[0][i], grid[1][i], grid[2][i], grid[3][i]];
        let old = row.slice();
        row.reverse();
        row = slide(row);
        row.reverse();
        for (let j = 0; j < size; j++) grid[j][i] = row[j];
        if (JSON.stringify(old) !== JSON.stringify(row)) moved = true;
    }
    return moved;
}

init();
