/**
 * keyboard_main.js
 * Keyboard-controlled version of the game.
 * Bypasses PoseEngine/Webcam and uses Arrow Keys.
 */

// Global Variables
let gameEngine;
let ctx;

/**
 * Initialize Application
 */
function init() {
    const startBtn = document.getElementById("startBtn");
    const stopBtn = document.getElementById("stopBtn");

    startBtn.disabled = true;

    try {
        // 1. Initialize GameEngine
        gameEngine = new GameEngine();

        // 2. Setup Canvas
        const canvas = document.getElementById("canvas");
        canvas.width = 600;
        canvas.height = 600;
        ctx = canvas.getContext("2d");

        // 3. Setup Keyboard Listeners
        window.addEventListener("keydown", handleKeydown);

        // 4. Start Game Loop
        startGameLoop();

        // 5. Start Game Logic
        gameEngine.setGameEndCallback((score, reason) => {
            showGameOverModal(score, reason);
            stop();
        });

        gameEngine.start();

        stopBtn.disabled = false;
        console.log("Keyboard Game Started!");

    } catch (error) {
        console.error("Error initializing:", error);
        alert("Failed to initialize game.");
        startBtn.disabled = false;
    }
}

/**
 * Handle Keyboard Input
 */
function handleKeydown(event) {
    if (!gameEngine || !gameEngine.isGameActive) return;

    switch (event.key) {
        case "ArrowLeft":
            gameEngine.onPoseDetected("LEFT");
            break;
        case "ArrowRight":
            gameEngine.onPoseDetected("RIGHT");
            break;
        case "ArrowDown":
        case "ArrowUp":
        case " ": // Spacebar
            gameEngine.onPoseDetected("CENTER");
            break;
    }
}

/**
 * Game Loop (Rendering)
 */
function startGameLoop() {
    function loop() {
        if (!gameEngine || !gameEngine.isGameActive) return; // Stop loop if game stopped

        // Clear Canvas
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        // Draw Background (Webcam placeholder)
        ctx.fillStyle = "#FFFFFF"; // White background
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        // Draw Text indicating Keyboard Mode
        ctx.fillStyle = "rgba(0, 0, 0, 0.1)"; // Dark text
        ctx.font = "30px Arial";
        ctx.textAlign = "center";
        ctx.fillText("Keyboard Mode", ctx.canvas.width / 2, ctx.canvas.height / 2);

        // Update & Render Game
        gameEngine.update(ctx.canvas.width, ctx.canvas.height);

        ctx.fillStyle = "#000000"; // Reset to solid black for game items
        gameEngine.render(ctx, ctx.canvas.width, ctx.canvas.height);

        requestAnimationFrame(loop);
    }
    loop();
}

/**
 * Stop Game
 */
function stop() {
    const startBtn = document.getElementById("startBtn");
    const stopBtn = document.getElementById("stopBtn");

    if (gameEngine) {
        gameEngine.stop();
    }

    // Remove Listener
    window.removeEventListener("keydown", handleKeydown);

    startBtn.disabled = false;
    stopBtn.disabled = true;
}

/**
 * Show Game Over Modal
 */
function showGameOverModal(score, reason) {
    const modal = document.getElementById("gameOverModal");
    const reasonText = document.getElementById("gameOverReason");
    const scoreText = document.getElementById("finalScore");

    reasonText.innerText = `Reason: ${reason}`;
    scoreText.innerText = score;
    modal.style.display = "block";
}

/**
 * Close Modal and Restart
 */
window.closeModalAndRestart = function () {
    const modal = document.getElementById("gameOverModal");
    modal.style.display = "none";
    init(); // Restart
};
