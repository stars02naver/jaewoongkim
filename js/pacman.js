/**
 * pacman.js
 * Enhanced Pacman
 */

let canvas, ctx;
let gridSize = 20;
let score = 0;
let level = 1;

// Directions: 0:Stop, 1:Up, 2:Right, 3:Down, 4:Left
let pacman = { x: 1, y: 1, dir: 0, nextDir: 0, mouthOpen: 0.2, mouthSpeed: 0.05 };

// Classic Map Layout (Simplified version)
const initialMap = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 2, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 2, 2, 1],
    [1, 2, 1, 1, 2, 1, 1, 1, 2, 1, 2, 1, 1, 1, 2, 1, 1, 2, 1],
    [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
    [1, 2, 1, 1, 2, 1, 2, 1, 1, 1, 1, 1, 2, 1, 2, 1, 1, 2, 1],
    [1, 2, 2, 2, 2, 1, 2, 2, 2, 1, 2, 2, 2, 1, 2, 2, 2, 2, 1],
    [1, 1, 1, 1, 2, 1, 1, 1, 0, 1, 0, 1, 1, 1, 2, 1, 1, 1, 1],
    [1, 2, 2, 2, 2, 1, 0, 0, 0, 3, 0, 0, 0, 1, 2, 2, 2, 2, 1], // 3 is Ghost House
    [1, 1, 1, 1, 2, 1, 0, 1, 1, 0, 1, 1, 0, 1, 2, 1, 1, 1, 1],
    [1, 2, 2, 2, 2, 2, 2, 1, 0, 0, 0, 1, 2, 2, 2, 2, 2, 2, 1],
    [1, 2, 1, 1, 2, 1, 2, 1, 1, 1, 1, 1, 2, 1, 2, 1, 1, 2, 1],
    [1, 2, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 2, 2, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
];

let map = [];
let dotsRemaining = 0;

let ghosts = [
    { x: 9, y: 7, color: "red", dir: 0 },
    { x: 8, y: 7, color: "pink", dir: 0 },
    { x: 10, y: 7, color: "cyan", dir: 0 }
];

function init() {
    canvas = document.getElementById("canvas");
    canvas.width = initialMap[0].length * gridSize;
    canvas.height = initialMap.length * gridSize;
    ctx = canvas.getContext("2d");

    startLevel();
    setInterval(gameLoop, 150); // Tick rate
    setInterval(animationLoop, 20); // Smooth animations
}

function startLevel() {
    // Deep copy map using standard for loop to avoid JSON issues with older browsers? No, JSON is fine.
    map = JSON.parse(JSON.stringify(initialMap));
    dotsRemaining = 0;

    // Count dots
    for (let r = 0; r < map.length; r++) {
        for (let c = 0; c < map[0].length; c++) {
            if (map[r][c] === 2) dotsRemaining++;
        }
    }

    // Reset positions
    pacman.x = 1; pacman.y = 1; pacman.dir = 0; pacman.nextDir = 0;
    ghosts = [
        { x: 9, y: 7, color: "red" },
        { x: 8, y: 7, color: "pink" },
        { x: 10, y: 7, color: "cyan" }
    ];

    updateUI();
}

function animationLoop() {
    // Mouth Animation
    pacman.mouthOpen += pacman.mouthSpeed;
    if (pacman.mouthOpen > 0.25 || pacman.mouthOpen < 0.02) pacman.mouthSpeed = -pacman.mouthSpeed;
    draw();
}

function gameLoop() {
    movePacman();
    moveGhosts();
    checkCollisions();
}

function movePacman() {
    // Try to change direction if queued
    let nextX = pacman.x;
    let nextY = pacman.y;
    applyDir(pacman.nextDir, nextX, nextY, (nx, ny) => {
        if (map[ny][nx] !== 1) {
            pacman.dir = pacman.nextDir; // Valid turn
        }
    });

    // Move in current direction
    nextX = pacman.x;
    nextY = pacman.y;

    if (pacman.dir === 1) nextY--;
    if (pacman.dir === 2) nextX++;
    if (pacman.dir === 3) nextY++;
    if (pacman.dir === 4) nextX--;

    // Collision Check
    if (map[nextY][nextX] !== 1) {
        pacman.x = nextX;
        pacman.y = nextY;

        // Eat Dot
        if (map[nextY][nextX] === 2) {
            map[nextY][nextX] = 0;
            score += 10;
            dotsRemaining--;
            updateUI();

            if (dotsRemaining === 0) {
                alert("Level Complete!");
                level++;
                startLevel();
            }
        }
    }
}

function applyDir(dir, x, y, callback) {
    let nx = x; let ny = y;
    if (dir === 1) ny--;
    if (dir === 2) nx++;
    if (dir === 3) ny++;
    if (dir === 4) nx--;
    callback(nx, ny);
}

function moveGhosts() {
    // Simple Random Movement
    // Increase speed/aggressiveness with level? (Here simply moving faster is hard in grid,
    // so we can make them move every tick or skip ticks, simple logic: ghosts move every tick)

    ghosts.forEach(g => {
        let validMoves = [];
        let dirs = [[0, -1], [1, 0], [0, 1], [-1, 0]]; // U, R, D, L

        dirs.forEach(d => {
            if (map[g.y + d[1]][g.x + d[0]] !== 1) {
                validMoves.push(d);
            }
        });

        if (validMoves.length > 0) {
            // Very simple AI: random valid move. 
            // Better AI would require tracking target tiles.
            let move = validMoves[Math.floor(Math.random() * validMoves.length)];
            g.x += move[0];
            g.y += move[1];
        }
    });
}

function checkCollisions() {
    ghosts.forEach(g => {
        if (g.x === pacman.x && g.y === pacman.y) {
            alert("Game Over!");
            score = 0;
            level = 1;
            startLevel();
        }
    });
}

function draw() {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Map
    for (let y = 0; y < map.length; y++) {
        for (let x = 0; x < map[y].length; x++) {
            if (map[y][x] === 1) {
                ctx.fillStyle = "blue";
                // Helper to draw clean walls (simple square for now)
                ctx.strokeStyle = "#1919A6";
                ctx.lineWidth = 1;
                ctx.strokeRect(x * gridSize, y * gridSize, gridSize, gridSize);
            } else if (map[y][x] === 2) {
                ctx.fillStyle = "#ffb897"; // Dot Color
                ctx.beginPath();
                ctx.arc(x * gridSize + gridSize / 2, y * gridSize + gridSize / 2, 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    // Pacman
    let cx = pacman.x * gridSize + gridSize / 2;
    let cy = pacman.y * gridSize + gridSize / 2;
    let angle = 0;
    if (pacman.dir === 1) angle = -Math.PI / 2;
    if (pacman.dir === 2) angle = 0;
    if (pacman.dir === 3) angle = Math.PI / 2;
    if (pacman.dir === 4) angle = Math.PI;

    ctx.fillStyle = "yellow";
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, gridSize / 2 - 2, angle + pacman.mouthOpen, angle + 2 * Math.PI - pacman.mouthOpen);
    ctx.fill();

    // Ghosts
    ghosts.forEach(g => {
        let gx = g.x * gridSize;
        let gy = g.y * gridSize;

        ctx.fillStyle = g.color;

        // Ghost Body (Dome + Feet)
        ctx.beginPath();
        ctx.arc(gx + gridSize / 2, gy + gridSize / 2 - 2, gridSize / 2 - 2, Math.PI, 0);
        ctx.lineTo(gx + gridSize - 2, gy + gridSize - 2);
        // Feet
        ctx.lineTo(gx + 2, gy + gridSize - 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = "white";
        ctx.beginPath();
        ctx.arc(gx + 6, gy + 8, 3, 0, Math.PI * 2);
        ctx.arc(gx + 14, gy + 8, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "blue";
        ctx.beginPath();
        ctx.arc(gx + 7, gy + 8, 1.5, 0, Math.PI * 2);
        ctx.arc(gx + 15, gy + 8, 1.5, 0, Math.PI * 2);
        ctx.fill();
    });
}

function updateUI() {
    document.getElementById("score").innerText = score;
    document.getElementById("level").innerText = level;
}

window.addEventListener("keydown", e => {
    // Queue the direction
    if (e.key === "ArrowUp") pacman.nextDir = 1;
    if (e.key === "ArrowRight") pacman.nextDir = 2;
    if (e.key === "ArrowDown") pacman.nextDir = 3;
    if (e.key === "ArrowLeft") pacman.nextDir = 4;
});

init();
