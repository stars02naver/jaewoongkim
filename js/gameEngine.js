/**
 * gameEngine.js
 * Fruit Catcher Game Logic
 * 
 * Manages game state: basket position, falling items, score, time.
 * Handles collision detection and rendering.
 */

class GameEngine {
  constructor() {
    this.score = 0;
    this.timeLimit = 60;
    this.isGameActive = false;
    this.items = []; // Falling items { x, y, type, speed }
    this.basketPosition = "CENTER"; // LEFT, CENTER, RIGHT
    this.lanes = {
      LEFT: 0.2,   // 20% width
      CENTER: 0.5, // 50% width
      RIGHT: 0.8   // 80% width
    };
    this.lastSpawnTime = 0;
    this.spawnInterval = 1000; // ms
    this.baseSpeed = 3.5; // Increased base speed

    // Callbacks
    this.onGameEnd = null;
    this.onScoreChange = null;
  }

  /**
   * Start the game
   */
  start() {
    this.isGameActive = true;
    this.score = 0;
    this.timeLimit = 60;
    this.items = [];
    this.basketPosition = "CENTER";
    this.lastSpawnTime = Date.now();
    this.spawnInterval = 1000;
    this.baseSpeed = 3.5; // Reset to increased speed

    // Start timer
    this.gameTimer = setInterval(() => {
      if (!this.isGameActive) return;
      this.timeLimit--;
      if (this.timeLimit <= 0) {
        this.endGame("Time Over");
      }
    }, 1000);
  }

  /**
   * Stop the game
   */
  stop() {
    this.isGameActive = false;
    if (this.gameTimer) {
      clearInterval(this.gameTimer);
      this.gameTimer = null;
    }
  }

  /**
   * End game with reason
   */
  endGame(reason) {
    this.stop();
    if (this.onGameEnd) {
      this.onGameEnd(this.score, reason);
    }
  }

  /**
   * Handle pose input
   * @param {string} detectedPose - LEFT, CENTER, RIGHT
   */
  onPoseDetected(detectedPose) {
    if (!this.isGameActive) return;
    if (["LEFT", "CENTER", "RIGHT"].includes(detectedPose)) {
      this.basketPosition = detectedPose;
    }
  }

  /**
   * Update game state (called every frame)
   */
  update(canvasWidth, canvasHeight) {
    if (!this.isGameActive) return;

    const now = Date.now();

    // 1. Spawn Items
    if (now - this.lastSpawnTime > this.spawnInterval) {
      this.spawnItem();
      this.lastSpawnTime = now;
      // Decrease interval slightly for difficulty
      this.spawnInterval = Math.max(400, this.spawnInterval - 10);
    }

    // 2. Move Items & Collision Detection
    for (let i = this.items.length - 1; i >= 0; i--) {
      let item = this.items[i];
      item.y += item.speed;

      // Check collision with basket
      // Basket is at the bottom, assume y range [height-50, height]
      // Hit detection: y > height - 60 AND correct lane
      if (item.y > canvasHeight - 60 && item.y < canvasHeight) {
        if (item.lane === this.basketPosition) {
          this.handleCollision(item);
          this.items.splice(i, 1);
          continue;
        }
      }

      // Check if off screen
      if (item.y > canvasHeight) {
        this.items.splice(i, 1);
      }
    }
  }

  spawnItem() {
    // Extended fruit types - Added MORE fruits!
    const types = [
      "APPLE", "BANANA", "ORANGE", "GRAPE", "WATERMELON", "PINEAPPLE",
      "STRAWBERRY", "PEACH", "CHERRY", "PEAR", "COCONUT", "LEMON", "KIWI", "MELON",
      "BOMB"
    ];

    // Weighted Random Selection
    const rand = Math.random();
    let type = "APPLE";

    // 10% Bomb
    if (rand > 0.90) type = "BOMB";

    // High Value Fruits (5%)
    else if (rand > 0.85) type = "PINEAPPLE";
    else if (rand > 0.80) type = "MELON";
    else if (rand > 0.75) type = "COCONUT";

    // Medium Value Fruits (25%) -> ~3.5% each
    else if (rand > 0.715) type = "WATERMELON";
    else if (rand > 0.68) type = "GRAPE";
    else if (rand > 0.645) type = "PEAR";
    else if (rand > 0.61) type = "PEACH";
    else if (rand > 0.575) type = "CHERRY";
    else if (rand > 0.54) type = "KIWI";
    else if (rand > 0.505) type = "LEMON";

    // Common Fruits (40%) -> ~13% each
    else if (rand > 0.37) type = "ORANGE";
    else if (rand > 0.24) type = "STRAWBERRY";
    else if (rand > 0.12) type = "BANANA";
    else type = "APPLE";

    const lanes = ["LEFT", "CENTER", "RIGHT"];
    const lane = lanes[Math.floor(Math.random() * lanes.length)];

    // Speed increases over time based on score/time
    const speed = this.baseSpeed + (60 - this.timeLimit) * 0.15;

    this.items.push({
      type: type,
      lane: lane,
      y: -100, // Start higher above screen
      speed: speed
    });
  }

  handleCollision(item) {
    if (item.type === "BOMB") {
      this.endGame("Hit by Bomb");
    } else {
      let points = 0;
      switch (item.type) {
        case "APPLE": points = 100; break;
        case "BANANA": points = 120; break;
        case "STRAWBERRY": points = 150; break;
        case "ORANGE": points = 180; break;
        case "LEMON": points = 200; break;
        case "KIWI": points = 220; break;
        case "GRAPE": points = 250; break;
        case "PEACH": points = 280; break;
        case "PEAR": points = 300; break;
        case "CHERRY": points = 350; break;
        case "WATERMELON": points = 400; break;
        case "COCONUT": points = 450; break;
        case "MELON": points = 480; break;
        case "PINEAPPLE": points = 500; break;
      }
      this.score += points;
    }

    if (this.onScoreChange) {
      this.onScoreChange(this.score);
    }
  }

  /**
   * Render game elements on canvas
   * @param {CanvasRenderingContext2D} ctx 
   * @param {number} width 
   * @param {number} height 
   */
  render(ctx, width, height) {
    if (!this.isGameActive) return;

    // Draw Basket (Emoji)
    const basketX = this.lanes[this.basketPosition] * width;
    const basketY = height - 50;

    ctx.fillStyle = "#000000"; // Force black color for text
    ctx.font = "80px Arial"; // Large emoji
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("🧺", basketX, basketY);

    // Draw Items
    this.items.forEach(item => {
      const x = this.lanes[item.lane] * width;
      const y = item.y;

      let text = "";
      switch (item.type) {
        case "APPLE": text = "🍎"; break;
        case "BANANA": text = "🍌"; break;
        case "STRAWBERRY": text = "🍓"; break;
        case "ORANGE": text = "🍊"; break;
        case "LEMON": text = "🍋"; break;
        case "KIWI": text = "🥝"; break;
        case "GRAPE": text = "🍇"; break;
        case "PEACH": text = "🍑"; break;
        case "PEAR": text = "🍐"; break;
        case "CHERRY": text = "🍒"; break;
        case "WATERMELON": text = "🍉"; break;
        case "COCONUT": text = "🥥"; break;
        case "MELON": text = "🍈"; break;
        case "PINEAPPLE": text = "🍍"; break;
        case "BOMB": text = "💣"; break;
      }

      ctx.font = "60px Arial";
      ctx.textAlign = "center";
      ctx.fillText(text, x, y);
    });

    // Draw Score & Time (Overlay on Canvas)
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(0, 0, width, 40);

    ctx.fillStyle = "white";
    ctx.font = "16px Arial";
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetical";
    ctx.fillText(`Score: ${this.score}`, 10, 25);

    ctx.textAlign = "right";
    ctx.fillText(`Time: ${this.timeLimit}`, width - 10, 25);
  }

  setScoreChangeCallback(callback) {
    this.onScoreChange = callback;
  }

  setGameEndCallback(callback) {
    this.onGameEnd = callback;
  }
}

window.GameEngine = GameEngine;
