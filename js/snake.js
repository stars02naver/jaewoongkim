/**
 * snake.js
 * Enhanced Snake Game
 */

let canvas, ctx;
let gameInterval;
let score = 0;
let level = 1;

const gridSize = 20;
let tileCount = 20; // 400x400

let posX = 10;
let posY = 10;
let velX = 0;
let velY = 0;

let trail = [];
let tail = 5;

let appleX = 15;
let appleY = 15;

let baseSpeed = 10; // FPS which determines speed

function init() {
    canvas = document.getElementById("canvas");
    canvas.width = 400;
    canvas.height = 400;
    ctx = canvas.getContext("2d");

    document.addEventListener("keydown", keyPush);

    // Reset
    score = 0;
    level = 1;
    tail = 5;
    trail = [];
    posX = 10; posY = 10;
    velX = 0; velY = 0;
    baseSpeed = 10;
    placeApple();
    updateUI();

    startGameLoop();
}

function startGameLoop() {
    if (gameInterval) clearInterval(gameInterval);
    // Speed increases with level
    let fps = baseSpeed + (level * 2);
    gameInterval = setInterval(game, 1000 / fps);
}

function game() {
    posX += velX;
    posY += velY;

    // Wrap around
    if (posX < 0) posX = tileCount - 1;
    if (posX > tileCount - 1) posX = 0;
    if (posY < 0) posY = tileCount - 1;
    if (posY > tileCount - 1) posY = 0;

    // Background
    ctx.fillStyle = "#2c3e50";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Snake
    for (let i = 0; i < trail.length; i++) {
        let isHead = (i === trail.length - 1);
        let segment = trail[i];

        // Gradient/Color
        if (isHead) {
            ctx.fillStyle = "#2ecc71"; // Bright Green Head
        } else {
            // Alternating green shades for body
            ctx.fillStyle = (i % 2 === 0) ? "#27ae60" : "#2ecc71";
        }

        // Draw Rounded Rect
        let x = segment.x * gridSize;
        let y = segment.y * gridSize;

        ctx.beginPath();
        ctx.roundRect(x, y, gridSize - 2, gridSize - 2, isHead ? 8 : 4);
        ctx.fill();

        // Eyes for Head
        if (isHead) {
            ctx.fillStyle = "white";
            // Determine eye position based on direction
            let eyeOffsetX = 5, eyeOffsetY = 5;

            // Simple eyes logic
            ctx.beginPath();
            ctx.arc(x + 5, y + 5, 2, 0, Math.PI * 2); // Left Eye
            ctx.arc(x + 15, y + 5, 2, 0, Math.PI * 2); // Right Eye
            ctx.fill();
        }

        // Self Collision
        if (segment.x === posX && segment.y === posY && (velX !== 0 || velY !== 0)) {
            gameOver();
        }
    }

    trail.push({ x: posX, y: posY });
    while (trail.length > tail) {
        trail.shift();
    }

    // Draw Apple (Realistic Look)
    let ax = appleX * gridSize + gridSize / 2;
    let ay = appleY * gridSize + gridSize / 2;

    // Apple Body
    ctx.fillStyle = "#e74c3c";
    ctx.beginPath();
    ctx.arc(ax, ay + 2, gridSize / 2 - 2, 0, Math.PI * 2);
    ctx.fill();

    // Leaf
    ctx.fillStyle = "#2ecc71";
    ctx.beginPath();
    ctx.arc(ax + 2, ay - 6, 3, 0, Math.PI * 2);
    ctx.fill();

    // Eat Apple
    if (appleX === posX && appleY === posY) {
        tail++;
        score += 10;

        // Level Up Logic
        if (score % 50 === 0) {
            level++;
            // Restart loop with new speed
            startGameLoop();
        }

        updateUI();
        placeApple();
    }
}

function placeApple() {
    appleX = Math.floor(Math.random() * tileCount);
    appleY = Math.floor(Math.random() * tileCount);
}

function keyPush(evt) {
    // Prevent reverse direction
    switch (evt.keyCode) {
        case 37: // Left
            if (velX !== 1) { velX = -1; velY = 0; }
            break;
        case 38: // Up
            if (velY !== 1) { velX = 0; velY = -1; }
            break;
        case 39: // Right
            if (velX !== -1) { velX = 1; velY = 0; }
            break;
        case 40: // Down
            if (velY !== -1) { velX = 0; velY = 1; }
            break;
    }
}

function gameOver() {
    tail = 5;
    score = 0;
    level = 1;
    updateUI();
    startGameLoop(); // Reset speed
}

function updateUI() {
    document.getElementById("score").innerText = score;
    document.getElementById("level").innerText = level;
}

// Polyfill for roundRect just in case
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
        if (w < 2 * r) r = w / 2;
        if (h < 2 * r) r = h / 2;
        this.beginPath();
        this.moveTo(x + r, y);
        this.arcTo(x + w, y, x + w, y + h, r);
        this.arcTo(x + w, y + h, x, y + h, r);
        this.arcTo(x, y + h, x, y, r);
        this.arcTo(x, y, x + w, y, r);
        this.closePath();
        return this;
    }
}
