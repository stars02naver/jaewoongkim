/**
 * flappy.js
 * Enhanced Flappy Bird
 */

let canvas, ctx;
let frames = 0;
const DEGREE = Math.PI / 180;

// Game State
let level = 1;

const bg = { color: "#70c5ce" };
const fg = { h: 112, color: "#ded895" };

const bird = {
    x: 50, y: 150, w: 34, h: 26, radius: 12,
    speed: 0, gravity: 0.25, jump: 4.6, rotation: 0,
    frame: 0,

    draw: function () {
        ctx.save();
        ctx.translate(this.x, this.y);
        // Rotate based on speed
        this.rotation = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, (this.speed * 0.1)));
        ctx.rotate(this.rotation);

        // Body
        ctx.fillStyle = "#f1c40f"; // Yellow
        ctx.beginPath();
        ctx.ellipse(0, 0, 17, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 2;
        ctx.stroke();

        // Eye
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(8, -6, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#000"; // Pupil
        ctx.beginPath();
        ctx.arc(10, -6, 2, 0, Math.PI * 2);
        ctx.fill();

        // Beak
        ctx.fillStyle = "#e67e22"; // Orange
        ctx.beginPath();
        ctx.moveTo(8, 2);
        ctx.lineTo(18, 6);
        ctx.lineTo(8, 10);
        ctx.fill();
        ctx.stroke();

        // Wing (Flapping animation)
        ctx.fillStyle = "#f39c12";
        ctx.beginPath();
        let wingY = (frames % 10 < 5) ? -5 : 2; // Simple flap
        ctx.ellipse(-5, wingY, 10, 6, -0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.restore();
    },

    update: function () {
        if (state.current == state.getReady) {
            this.y = 150;
            this.rotation = 0;
            this.speed = 0;
        } else {
            this.speed += this.gravity;
            this.y += this.speed;

            if (this.y + this.radius >= canvas.height - fg.h) {
                this.y = canvas.height - fg.h - this.radius;
                if (state.current == state.game) {
                    state.current = state.over;
                }
            }
        }
    },
    flap: function () {
        this.speed = -this.jump;
    }
};

const pipes = {
    position: [],
    w: 52, h: 400, gap: 120, // Initial gap
    dx: 2, // Initial speed

    draw: function () {
        for (let i = 0; i < this.position.length; i++) {
            let p = this.position[i];
            let topY = p.y;
            let bottomY = p.y + this.h + this.gap;

            // Pipe Color (Green with highlight)
            ctx.fillStyle = "#2ecc71";
            ctx.strokeStyle = "#27ae60";
            ctx.lineWidth = 2;

            // Top Pipe
            ctx.fillRect(p.x, topY, this.w, this.h);
            ctx.strokeRect(p.x, topY, this.w, this.h);

            // Cap
            ctx.fillStyle = "#27ae60";
            ctx.fillRect(p.x - 2, topY + this.h - 20, this.w + 4, 20);

            // Bottom Pipe
            ctx.fillStyle = "#2ecc71";
            ctx.fillRect(p.x, bottomY, this.w, this.h);
            ctx.strokeRect(p.x, bottomY, this.w, this.h);

            // Cap
            ctx.fillStyle = "#27ae60";
            ctx.fillRect(p.x - 2, bottomY, this.w + 4, 20);
        }
    },

    update: function () {
        if (state.current !== state.game) return;

        // Level Scaling
        this.dx = 2 + (Math.floor(score.value / 10) * 0.5); // Speed up
        this.gap = Math.max(80, 120 - (Math.floor(score.value / 5) * 5)); // Gap closes

        if (frames % 100 == 0) {
            this.position.push({
                x: canvas.width,
                y: -150 * (Math.random() + 1)
            });
        }

        for (let i = 0; i < this.position.length; i++) {
            let p = this.position[i];
            p.x -= this.dx;

            // Collision
            let bottomPipeY = p.y + this.h + this.gap;

            if (bird.x + bird.radius > p.x && bird.x - bird.radius < p.x + this.w &&
                bird.y - bird.radius < p.y + this.h) {
                state.current = state.over;
            }
            if (bird.x + bird.radius > p.x && bird.x - bird.radius < p.x + this.w &&
                bird.y + bird.radius > bottomPipeY) {
                state.current = state.over;
            }

            if (p.x + this.w <= 0) {
                this.position.shift();
                score.value += 1;
                score.best = Math.max(score.value, score.best);
                document.getElementById("score").innerText = score.value;
            }
        }
    },
    reset: function () {
        this.position = [];
        this.dx = 2;
        this.gap = 120;
    }
}

const score = {
    best: 0,
    value: 0,
    draw: function () {
        if (state.current == state.over) {
            ctx.fillStyle = "white";
            ctx.font = "30px Arial";
            ctx.lineWidth = 2;
            ctx.strokeStyle = "black";

            ctx.fillText("Game Over", 80, 200);
            ctx.strokeText("Game Over", 80, 200);

            ctx.font = "20px Arial";
            ctx.fillText("Score: " + this.value, 110, 240);
            ctx.fillText("Best: " + this.best, 115, 270);
        }
    }
}

const state = {
    current: 0,
    getReady: 0,
    game: 1,
    over: 2
}

function init() {
    canvas = document.getElementById("canvas");
    canvas.width = 320;
    canvas.height = 480;
    ctx = canvas.getContext("2d");

    // Input Handling
    const handleInput = () => {
        switch (state.current) {
            case state.getReady:
                state.current = state.game;
                break;
            case state.game:
                bird.flap();
                break;
            case state.over:
                state.current = state.getReady;
                pipes.reset();
                score.value = 0;
                document.getElementById("score").innerText = 0;
                frames = 0;
                break;
        }
    };

    canvas.addEventListener("click", handleInput);
    document.addEventListener("keydown", function (e) {
        if (e.code === "Space") handleInput();
    });

    loop();
}

function loop() {
    update();
    draw();
    frames++;
    requestAnimationFrame(loop);
}

function update() {
    bird.update();
    pipes.update();
}

function draw() {
    ctx.fillStyle = bg.color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Clouds (Static decor)
    ctx.fillStyle = "#ecf0f1";
    ctx.beginPath();
    ctx.arc(50, 400, 30, 0, Math.PI * 2);
    ctx.arc(90, 400, 40, 0, Math.PI * 2);
    ctx.arc(130, 400, 30, 0, Math.PI * 2);
    ctx.fill();

    pipes.draw();

    // FG
    ctx.fillStyle = fg.color;
    ctx.fillRect(0, canvas.height - fg.h, canvas.width, fg.h);
    // FG Grass Top
    ctx.fillStyle = "#73bf2e";
    ctx.fillRect(0, canvas.height - fg.h, canvas.width, 10);


    bird.draw();
    score.draw();
}

init();
