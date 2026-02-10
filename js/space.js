/**
 * space.js
 * Enhanced Space Invaders
 */

let canvas, ctx;
let gameLoopId;

// Game State
let level = 1;
let score = 0;
let gameOver = false;
let isPaused = false;

// Player
let player = {
    x: 300, y: 550, w: 40, h: 30, color: '#00ff00',
    speed: 5,
    dx: 0,
    cooldown: 0
};

// Projectiles
let bullets = [];       // Player bullets
let enemyBullets = [];  // Alien bullets

// Enemies
let enemies = [];
let enemyRows = 4;
let enemyCols = 8;
let enemyDir = 1;
let enemySpeed = 1;
let enemyFireRate = 0.005; // Chance per frame to shoot

// Inputs
let keys = {};

// Assets (Simple Pixel Art drawn via code)
const alienSprites = [
    [0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0],
    [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
    [0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0],
    [0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1],
    [1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1],
    [0, 0, 0, 1, 1, 0, 1, 1, 0, 0, 0]
]; // 11x8 grid

const shipSprite = [
    [0, 0, 0, 0, 1, 0, 0, 0, 0],
    [0, 0, 0, 1, 1, 1, 0, 0, 0],
    [0, 0, 0, 1, 1, 1, 0, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 0],
    [1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 0, 0, 0, 0, 0, 1, 1]
]; // 9x8 grid

function init() {
    canvas = document.getElementById("canvas");
    canvas.width = 600;
    canvas.height = 600;
    ctx = canvas.getContext("2d");

    // Reset Game
    level = 1;
    score = 0;
    gameOver = false;
    updateUI();

    startLevel();

    // Listeners
    window.addEventListener("keydown", e => keys[e.code] = true);
    window.addEventListener("keyup", e => keys[e.code] = false);

    if (gameLoopId) cancelAnimationFrame(gameLoopId);
    loop();
}

function startLevel() {
    // Reset Entities
    bullets = [];
    enemyBullets = [];
    enemies = [];
    player.x = canvas.width / 2 - player.w / 2;

    // Difficulty Scaling
    enemyRows = Math.min(6, 3 + Math.floor(level / 2));
    enemySpeed = 1 + (level * 0.2);
    enemyFireRate = 0.005 + (level * 0.002);

    // Spawn Enemies
    for (let r = 0; r < enemyRows; r++) {
        for (let c = 0; c < enemyCols; c++) {
            enemies.push({
                x: 50 + c * 55,
                y: 50 + r * 45,
                w: 33, h: 24, // Scaled sprite size
                active: true,
                type: r % 2 // Alternating types if we had more sprites
            });
        }
    }

    updateUI();
}

function loop() {
    if (gameOver) return;

    update();
    render();

    gameLoopId = requestAnimationFrame(loop);
}

function update() {
    // 1. Player Movement
    if (keys['ArrowLeft'] && player.x > 0) player.x -= player.speed;
    if (keys['ArrowRight'] && player.x + player.w < canvas.width) player.x += player.speed;

    // 2. Player Shoot
    if (player.cooldown > 0) player.cooldown--;
    if (keys['Space'] && player.cooldown <= 0) {
        bullets.push({ x: player.x + player.w / 2 - 2, y: player.y, w: 4, h: 10, color: '#0ff' });
        player.cooldown = 20; // Fire rate limit
    }

    // 3. Move Player Bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].y -= 7;
        if (bullets[i].y < 0) bullets.splice(i, 1);
    }

    // 4. Move Enemy Bullets
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        enemyBullets[i].y += 4;

        // Player Collision
        if (rectIntersect(enemyBullets[i], player)) {
            gameOver = true;
            alert("Game Over! Hit by alien laser.");
            return;
        }

        if (enemyBullets[i].y > canvas.height) enemyBullets.splice(i, 1);
    }

    // 5. Move Enemies
    let hitEdge = false;
    let activeEnemies = 0;

    for (let e of enemies) {
        if (!e.active) continue;
        activeEnemies++;

        e.x += enemySpeed * enemyDir;

        // Random Shooting
        if (Math.random() < enemyFireRate) {
            enemyBullets.push({ x: e.x + e.w / 2, y: e.y + e.h, w: 4, h: 8, color: '#f00' });
        }

        if (e.x <= 0 || e.x + e.w >= canvas.width) hitEdge = true;

        // Invasion Check
        if (e.y + e.h >= player.y) {
            gameOver = true;
            alert("Game Over! Earth Invaded.");
            return;
        }
    }

    if (hitEdge) {
        enemyDir *= -1;
        for (let e of enemies) {
            e.y += 20;
        }
    }

    // 6. Bullet-Enemy Collision
    for (let i = bullets.length - 1; i >= 0; i--) {
        let b = bullets[i];
        let hit = false;
        for (let e of enemies) {
            if (!e.active) continue;
            if (rectIntersect(b, e)) {
                e.active = false;
                hit = true;
                score += 100 * level;
                updateUI();
                break;
            }
        }
        if (hit) bullets.splice(i, 1);
    }

    // 7. Level Complete
    if (activeEnemies === 0) {
        level++;
        alert(`Level ${level - 1} Complete! Starting Level ${level}.`);
        startLevel();
    }
}

function render() {
    // Clear
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Stars background (static for performance)
    if (Math.random() > 0.9) ctx.fillStyle = "white"; // Twinkle effect
    // ... skipping complex stars for now

    // Player (Draw Sprite)
    drawSprite(shipSprite, player.x, player.y, player.w, player.h, '#0f0');

    // Enemies (Draw Sprite)
    enemies.forEach(e => {
        if (e.active) {
            drawSprite(alienSprites, e.x, e.y, e.w, e.h, '#fff');
        }
    });

    // Bullets
    ctx.fillStyle = '#0ff';
    bullets.forEach(b => ctx.fillRect(b.x, b.y, b.w, b.h));

    // Enemy Bullets
    ctx.fillStyle = '#f00';
    enemyBullets.forEach(b => ctx.fillRect(b.x, b.y, b.w, b.h));
}

// Helper: Draw Pixel Art Grid
function drawSprite(sprite, x, y, w, h, color) {
    ctx.fillStyle = color;
    let pixelW = w / sprite[0].length;
    let pixelH = h / sprite.length;

    for (let r = 0; r < sprite.length; r++) {
        for (let c = 0; c < sprite[0].length; c++) {
            if (sprite[r][c] === 1) {
                ctx.fillRect(x + c * pixelW, y + r * pixelH, pixelW, pixelH);
            }
        }
    }
}

function rectIntersect(r1, r2) {
    return !(r2.x > r1.x + r1.w ||
        r2.x + r2.w < r1.x ||
        r2.y > r1.y + r1.h ||
        r2.y + r2.h < r1.y);
}

function updateUI() {
    document.getElementById("score").innerText = score;
    document.getElementById("level").innerText = level;
}

init();
