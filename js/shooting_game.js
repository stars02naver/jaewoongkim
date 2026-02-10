/**
 * shooting_game.js
 * "Gun Range" Mode: Mouse Aim & Click to Shoot
 */

let canvas, ctx;
let gameLoopId;
let isGameActive = false;
let score = 0;
let timeLimit = 60;
let timerId;

// Game Objects
const player = {
    x: 300,
    y: 300,
    radius: 20, // Red Circle Radius
    color: "rgba(231, 76, 60, 0.8)", // Red with transparency
    crosshairColor: "#fff"
};

let enemies = [];
// Projectiles are now just visual "bangs" or skipped for hitscan
let explosions = [];

// Config
const SPAWN_INTERVAL = 800;
let lastSpawnTime = 0;

/**
 * Initialize Game
 */
function init() {
    canvas = document.getElementById("canvas");
    canvas.width = 600;
    canvas.height = 600;
    ctx = canvas.getContext("2d");

    // Reset State
    score = 0;
    timeLimit = 60;
    enemies = [];
    explosions = [];
    isGameActive = true;

    // Hide default cursor
    canvas.style.cursor = "none";

    // UI Updates
    document.getElementById("startBtn").disabled = true;
    document.getElementById("stopBtn").disabled = false;

    // Listeners
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mousedown", handleMouseDown);

    // Initial Spawn
    spawnEnemyRow();

    // Timers
    if (timerId) clearInterval(timerId);
    timerId = setInterval(() => {
        if (!isGameActive) return;
        timeLimit--;
        if (timeLimit <= 0) endGame("Time's Up!");
    }, 1000);

    // Loop
    loop();
}

/**
 * Game Loop
 */
function loop() {
    if (!isGameActive) return;

    update();
    render();

    gameLoopId = requestAnimationFrame(loop);
}

/**
 * Update Logic
 */
function update() {
    // 1. Move Enemies
    const now = Date.now();
    if (now - lastSpawnTime > SPAWN_INTERVAL) {
        spawnEnemyRow();
        lastSpawnTime = now;
    }

    for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];

        // Move
        e.x += e.speed * e.direction;

        // Bounce off walls
        if (e.x <= 0 || e.x + e.width >= canvas.width) {
            e.direction *= -1;
        }

        // Remove if too old? (Optional, maybe keep them bouncing)
    }

    // 2. Fragment particles (Explosions)
    for (let i = explosions.length - 1; i >= 0; i--) {
        explosions[i].life--;
        if (explosions[i].life <= 0) explosions.splice(i, 1);
    }
}

/**
 * Render Logic
 */
function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Enemies
    ctx.font = "40px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    enemies.forEach(e => {
        ctx.fillText(e.emoji, e.x + e.width / 2, e.y + e.height / 2);
    });

    // Explosions
    explosions.forEach(exp => {
        ctx.fillStyle = `rgba(255, 255, 0, ${exp.life / 10})`;
        ctx.beginPath();
        ctx.arc(exp.x, exp.y, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "red";
        ctx.font = "20px Arial";
        ctx.fillText("HIT!", exp.x, exp.y - 10);
    });

    // Player (Crosshair) - Red Circle
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.strokeStyle = "red";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = "rgba(255, 0, 0, 0.2)";
    ctx.fill();

    // Crosshair Lines
    ctx.beginPath();
    ctx.moveTo(player.x - player.radius, player.y);
    ctx.lineTo(player.x + player.radius, player.y);
    ctx.moveTo(player.x, player.y - player.radius);
    ctx.lineTo(player.x, player.y + player.radius);
    ctx.strokeStyle = "red";
    ctx.stroke();

    // HUD
    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.textAlign = "left";
    ctx.fillText(`Score: ${score}`, 10, 30);
    ctx.textAlign = "right";
    ctx.fillText(`Time: ${timeLimit}`, canvas.width - 10, 30);
}

/**
 * Handlers
 */
function handleMouseMove(e) {
    if (!isGameActive) return;
    const rect = canvas.getBoundingClientRect();
    player.x = e.clientX - rect.left;
    player.y = e.clientY - rect.top;
}

function handleMouseDown(e) {
    if (!isGameActive) return;

    // Visual recoil/flash
    explosions.push({
        x: player.x,
        y: player.y,
        life: 5
    });

    // Hitscan Detection
    for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        // Simple Circle-Rect or Point-Rect intersection
        // Cursor is a point (player.x, player.y) 
        if (player.x >= e.x && player.x <= e.x + e.width &&
            player.y >= e.y && player.y <= e.y + e.height) {

            // Hit!
            score += e.score;
            enemies.splice(i, 1);

            // Limit explosions
            if (explosions.length > 5) explosions.shift();
            break; // One shot, one kill
        }
    }
}

/**
 * Helpers
 */
function spawnEnemyRow() {
    const y = 50 + Math.random() * (canvas.height - 100);
    const typeRand = Math.random();
    let type = "RUNNER";
    let speed = 2 + Math.random() * 3;
    let emoji = "🏃";
    let scoreVal = 300;

    if (typeRand > 0.8) {
        type = "VILLAIN";
        speed = 5 + Math.random() * 3;
        emoji = "🦹";
        scoreVal = 500;
    } else if (typeRand < 0.3) {
        type = "ZOMBIE";
        speed = 1 + Math.random();
        emoji = "🧟";
        scoreVal = 100;
    }

    enemies.push({
        x: Math.random() > 0.5 ? 0 : canvas.width - 40,
        y: y,
        width: 40,
        height: 40,
        speed: speed,
        direction: Math.random() > 0.5 ? 1 : -1,
        type: type,
        emoji: emoji,
        score: scoreVal
    });
}

function stop() {
    isGameActive = false;
    cancelAnimationFrame(gameLoopId);
    clearInterval(timerId);

    document.getElementById("startBtn").disabled = false;
    document.getElementById("stopBtn").disabled = true;

    canvas.style.cursor = "default"; // Restore cursor

    canvas.removeEventListener("mousemove", handleMouseMove);
    canvas.removeEventListener("mousedown", handleMouseDown);
}

function endGame(reason) {
    stop();
    document.getElementById("gameOverReason").innerText = reason;
    document.getElementById("finalScore").innerText = score;
    document.getElementById("gameOverModal").style.display = "block";
}

window.closeModalAndRestart = function () {
    document.getElementById("gameOverModal").style.display = "none";
    init();
};
