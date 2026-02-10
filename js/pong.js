/**
 * pong.js
 * Classic Pong
 */

let canvas, ctx;
let gameLoopId;

// Ball
let ballX = 50;
let ballY = 50;
let ballSpeedX = 6;
let ballSpeedY = 4;

// Paddles
let paddle1Y = 250;
let paddle2Y = 250;
const PADDLE_HEIGHT = 100;
const PADDLE_THICKNESS = 10;

// Score
let player1Score = 0;
let player2Score = 0;
const WINNING_SCORE = 5;
let showingWinScreen = false;

function init() {
    canvas = document.getElementById("canvas");
    canvas.width = 800;
    canvas.height = 600;
    ctx = canvas.getContext("2d");

    canvas.addEventListener('mousemove', function (evt) {
        let mousePos = calculateMousePos(evt);
        paddle1Y = mousePos.y - (PADDLE_HEIGHT / 2);
    });

    // Reset loop
    if (gameLoopId) cancelAnimationFrame(gameLoopId);
    loop();
}

function loop() {
    moveEverything();
    drawEverything();
    gameLoopId = requestAnimationFrame(loop);
}

function ballReset() {
    if (player1Score >= WINNING_SCORE || player2Score >= WINNING_SCORE) {
        showingWinScreen = true;
    }
    ballSpeedX = -ballSpeedX;
    ballX = canvas.width / 2;
    ballY = canvas.height / 2;
}

function calculateMousePos(evt) {
    let rect = canvas.getBoundingClientRect();
    let root = document.documentElement;
    let mouseX = evt.clientX - rect.left - root.scrollLeft;
    let mouseY = evt.clientY - rect.top - root.scrollTop;
    return { x: mouseX, y: mouseY };
}

function computerMovement() {
    let paddle2YCenter = paddle2Y + (PADDLE_HEIGHT / 2);
    if (paddle2YCenter < ballY - 35) {
        paddle2Y += 6;
    } else if (paddle2YCenter > ballY + 35) {
        paddle2Y -= 6;
    }
}

function moveEverything() {
    if (showingWinScreen) return;

    computerMovement();

    ballX += ballSpeedX;
    ballY += ballSpeedY;

    // Left Side
    if (ballX < 0) {
        if (ballY > paddle1Y && ballY < paddle1Y + PADDLE_HEIGHT) {
            ballSpeedX = -ballSpeedX;
            let deltaY = ballY - (paddle1Y + PADDLE_HEIGHT / 2);
            ballSpeedY = deltaY * 0.35;
        } else {
            player2Score++;
            updateScore();
            ballReset();
        }
    }

    // Right Side
    if (ballX > canvas.width) {
        if (ballY > paddle2Y && ballY < paddle2Y + PADDLE_HEIGHT) {
            ballSpeedX = -ballSpeedX;
            let deltaY = ballY - (paddle2Y + PADDLE_HEIGHT / 2);
            ballSpeedY = deltaY * 0.35;
        } else {
            player1Score++;
            updateScore();
            ballReset();
        }
    }

    // Top/Bottom
    if (ballY < 0) ballSpeedY = -ballSpeedY;
    if (ballY > canvas.height) ballSpeedY = -ballSpeedY;
}

function drawEverything() {
    // BG
    colorRect(0, 0, canvas.width, canvas.height, 'black');

    if (showingWinScreen) {
        ctx.fillStyle = 'white';
        ctx.font = "30px Arial";
        ctx.textAlign = "center";
        if (player1Score >= WINNING_SCORE) {
            ctx.fillText("You Won!", canvas.width / 2, 200);
        } else {
            ctx.fillText("AI Won...", canvas.width / 2, 200);
        }
        ctx.fillText("Click to Restart", canvas.width / 2, 500);
        return;
    }

    // Net
    for (let i = 0; i < canvas.height; i += 40) {
        colorRect(canvas.width / 2 - 1, i, 2, 20, 'white');
    }

    // Left Paddle
    colorRect(0, paddle1Y, PADDLE_THICKNESS, PADDLE_HEIGHT, 'white');

    // Right Paddle
    colorRect(canvas.width - PADDLE_THICKNESS, paddle2Y, PADDLE_THICKNESS, PADDLE_HEIGHT, 'white');

    // Ball
    colorCircle(ballX, ballY, 10, 'white');
}

function colorCircle(centerX, centerY, radius, drawColor) {
    ctx.fillStyle = drawColor;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2, true);
    ctx.fill();
}

function colorRect(leftX, topY, width, height, drawColor) {
    ctx.fillStyle = drawColor;
    ctx.fillRect(leftX, topY, width, height);
}

function updateScore() {
    document.getElementById("playerScore").innerText = player1Score;
    document.getElementById("aiScore").innerText = player2Score;
}

document.addEventListener('mousedown', mouseClick);
function mouseClick(evt) {
    if (showingWinScreen) {
        player1Score = 0;
        player2Score = 0;
        updateScore();
        showingWinScreen = false;
    }
}
