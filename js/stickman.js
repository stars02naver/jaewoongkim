/**
 * stickman.js
 * 1v1 Physics Fighter with Weapons
 */

let canvas, ctx;
let width, height;
const friction = 0.98; // Slightly more drag for stability
const gravity = 0.5;

let points = [];
let sticks = [];
let p1, p2;
let p1Score = 0;
let p2Score = 0;
let gameActive = false;

// --- PHYSICS ENGINE ---

class Point {
    constructor(x, y, locked = false, mass = 1) {
        this.x = x; this.y = y;
        this.oldx = x; this.oldy = y;
        this.locked = locked;
        this.mass = mass;
    }

    update() {
        if (!this.locked) {
            let vx = (this.x - this.oldx) * friction;
            let vy = (this.y - this.oldy) * friction;
            this.oldx = this.x;
            this.oldy = this.y;
            this.x += vx;
            this.y += vy;
            this.y += gravity * this.mass;
        }
    }

    constrain() {
        // Floor
        if (this.y > height - 20) {
            this.y = height - 20;
            // Friction on floor
            let vx = this.x - this.oldx;
            this.oldx = this.x - (vx * 0.5);
        }
        // Walls
        if (this.x > width) { this.x = width; this.oldx = this.x + (this.x - this.oldx) * 0.5; }
        if (this.x < 0) { this.x = 0; this.oldx = this.x + (this.x - this.oldx) * 0.5; }
    }
}

class Stick {
    constructor(p0, p1, length, color = "#333", width = 5) {
        this.p0 = p0; this.p1 = p1;
        this.length = length || distance(p0, p1);
        this.color = color;
        this.width = width;
    }

    update() {
        let dx = this.p1.x - this.p0.x;
        let dy = this.p1.y - this.p0.y;
        let dist = Math.sqrt(dx * dx + dy * dy);
        let diff = this.length - dist;
        let percent = diff / dist / 2;
        let offsetX = dx * percent;
        let offsetY = dy * percent;

        if (!this.p0.locked) {
            this.p0.x -= offsetX;
            this.p0.y -= offsetY;
        }
        if (!this.p1.locked) {
            this.p1.x += offsetX;
            this.p1.y += offsetY;
        }
    }

    draw() {
        ctx.beginPath();
        ctx.lineWidth = this.width;
        ctx.strokeStyle = this.color;
        ctx.moveTo(this.p0.x, this.p0.y);
        ctx.lineTo(this.p1.x, this.p1.y);
        ctx.stroke();
    }
}

function distance(p0, p1) {
    let dx = p1.x - p0.x;
    let dy = p1.y - p0.y;
    return Math.sqrt(dx * dx + dy * dy);
}

// --- RAGDOLL & WEAPONS ---

function createRagdoll(x, y, color) {
    let head = new Point(x, y - 50, false, 0.8); // Lighter head
    let neck = new Point(x, y, false, 1);
    let spine = new Point(x, y + 40, false, 1);
    let pelvis = new Point(x, y + 70, false, 1.2);

    // Arms
    let lShoulder = new Point(x - 20, y + 5);
    let rShoulder = new Point(x + 20, y + 5);
    let lElbow = new Point(x - 40, y + 30);
    let rElbow = new Point(x + 40, y + 30);
    let lHand = new Point(x - 60, y + 40); // Hands lower
    let rHand = new Point(x + 60, y + 40);

    // Legs
    let lHip = new Point(x - 15, y + 70);
    let rHip = new Point(x + 15, y + 70);
    let lKnee = new Point(x - 25, y + 120);
    let rKnee = new Point(x + 25, y + 120);
    let lFoot = new Point(x - 30, y + 170);
    let rFoot = new Point(x + 30, y + 170);

    let parts = [head, neck, spine, pelvis, lShoulder, rShoulder, lElbow, rElbow, lHand, rHand, lHip, rHip, lKnee, rKnee, lFoot, rFoot];
    points.push(...parts);

    // Color Logic
    let sCol = color;

    // Body Sticks
    let bodySticks = [
        new Stick(head, neck, null, sCol, 8),
        new Stick(neck, spine, null, sCol, 10),
        new Stick(spine, pelvis, null, sCol, 10),

        new Stick(neck, lShoulder, null, sCol, 8),
        new Stick(neck, rShoulder, null, sCol, 8),
        new Stick(lShoulder, lElbow, null, sCol, 6),
        new Stick(lElbow, lHand, null, sCol, 6),
        new Stick(rShoulder, rElbow, null, sCol, 6),
        new Stick(rElbow, rHand, null, sCol, 6),

        new Stick(pelvis, lHip, null, sCol, 9),
        new Stick(pelvis, rHip, null, sCol, 9),
        new Stick(lHip, lKnee, null, sCol, 8),
        new Stick(lKnee, lFoot, null, sCol, 8),
        new Stick(rHip, rKnee, null, sCol, 8),
        new Stick(rKnee, rFoot, null, sCol, 8),

        // Structural
        new Stick(lShoulder, rShoulder, null, "rgba(0,0,0,0)"),
        new Stick(lHip, rHip, null, "rgba(0,0,0,0)"),
        new Stick(lShoulder, lHip, null, "rgba(0,0,0,0)"),
        new Stick(rShoulder, rHip, null, "rgba(0,0,0,0)")
    ];
    sticks.push(...bodySticks);

    return {
        head, neck, spine, pelvis,
        lHand, rHand, lFoot, rFoot,
        lKnee, rKnee, lElbow, rElbow,
        parts
    };
}

function equipWeapon(ragdoll, type) {
    let hand = ragdoll.rHand; // Right hand primary
    let otherHand = ragdoll.lHand;
    let x = hand.x;
    let y = hand.y;

    if (type === 'none') {
        // Just big heavy fists
        hand.mass = 4;
        otherHand.mass = 4;
        return;
    }

    let wColor = "#888";

    // Helper to add stick
    const addStick = (p1, p2, col = wColor, w = 4) => sticks.push(new Stick(p1, p2, null, col, w));
    const addPoint = (offX, offY, mass = 1) => {
        let p = new Point(x + offX, y + offY, false, mass);
        points.push(p);
        return p;
    };

    if (type === 'bat') {
        let tip = addPoint(0, -60, 2);
        addStick(hand, tip, "#d35400", 6); // Wood
    }
    else if (type === 'knife') {
        let tip = addPoint(0, -20, 1);
        addStick(hand, tip, "#ccc", 4);
    }
    else if (type === 'sword') {
        let hilt = addPoint(0, 10, 1);
        let tip = addPoint(0, -70, 1.5);
        addStick(hilt, hand, "#333", 4);
        addStick(hand, tip, "#ccc", 4);
    }
    else if (type === 'spear') {
        let bottom = addPoint(0, 40, 0.5);
        let tip = addPoint(0, -100, 1);
        addStick(bottom, hand, "#654321", 3);
        addStick(hand, tip, "#654321", 3);
        // Head
        let head = addPoint(0, -110, 0.1);
        addStick(tip, head, "#ccc", 6);
    }
    else if (type === 'axe') {
        let tip = addPoint(0, -60, 1);
        addStick(hand, tip, "#654321", 5);
        // Axe Head
        let blade1 = addPoint(-15, -60, 2);
        let blade2 = addPoint(15, -60, 2);
        addStick(blade1, blade2, "#555", 10);
        addStick(blade1, tip, "#555", 8);
        addStick(blade2, tip, "#555", 8);
    }
    else if (type === 'hammer') {
        let tip = addPoint(0, -50, 1);
        addStick(hand, tip, "#333", 5);
        // Head
        let b1 = addPoint(-15, -50, 4); // Heavy!
        let b2 = addPoint(15, -50, 4);
        addStick(b1, b2, "#222", 20);
        addStick(tip, b1);
        addStick(tip, b2);
    }
    else if (type === 'mace') {
        let handle = addPoint(0, -40, 1);
        addStick(hand, handle, "#333", 5);
        // Chain
        let c1 = addPoint(0, -55, 0.5);
        let ball = addPoint(0, -75, 4); // Heavy Ball
        addStick(handle, c1, "#111", 2);
        addStick(c1, ball, "#111", 2);
    }
    else if (type === 'nunchuck') {
        let h1 = addPoint(0, -30, 1);
        addStick(hand, h1, "#333", 5);

        let c1 = addPoint(10, -30, 0.5);
        let c2 = addPoint(20, -30, 0.5);

        let h2_top = addPoint(30, -30, 1);
        let h2_bot = addPoint(30, 0, 1);

        addStick(h1, c1, "#111", 2);
        addStick(c1, c2, "#111", 2);
        addStick(c2, h2_top, "#111", 2);
        addStick(h2_top, h2_bot, "#333", 5);
    }
    else if (type === 'staff') {
        // Two handed? Let's just make it long and held in middle
        let top = addPoint(0, -80, 1);
        let bot = addPoint(0, 80, 1);
        addStick(bot, hand, "#8e44ad", 4);
        addStick(hand, top, "#8e44ad", 4);

        // Constrain left hand to stick too? (Complex, skip for now)
    }
    else if (type === 'dagger') {
        // Dual wield?
        let t1 = addPoint(0, -15, 0.5);
        addStick(hand, t1, "#ccc", 3);

        let t2 = addPoint(0, -15, 0.5); // For left hand
        // Hacky add to other hand
        sticks.push(new Stick(otherHand, t2, null, "#ccc", 3));
        points.push(t2);
    }
}

// --- GAME LOGIC ---

function startGame() {
    document.getElementById("ui-layer").style.display = "none";
    document.getElementById("canvas").style.display = "block";
    document.getElementById("game-hud").style.display = "flex";

    let w1 = document.getElementById("p1-weapon").value;
    let w2 = document.getElementById("p2-weapon").value;

    initGame(w1, w2);
}

function initGame(w1, w2) {
    canvas = document.getElementById("canvas");
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    ctx = canvas.getContext("2d");

    points = [];
    sticks = [];

    // Spawn Players 
    // P1 (Left, Green)
    p1 = createRagdoll(width * 0.3, height - 250, "#2ecc71");
    // P2 (Right, Red)
    p2 = createRagdoll(width * 0.7, height - 250, "#e74c3c");

    // Equip Weapons
    equipWeapon(p1, w1);
    equipWeapon(p2, w2);

    gameActive = true;
    loop();
}

function applyStandForce(player) {
    // Spring force to keep head above pelvis
    let k = 0.05; // Spring constant
    let desiredX = player.pelvis.x;
    let desiredY = player.pelvis.y - 120; // Head should be above pelvis

    // Apply force to head
    player.head.x += (desiredX - player.head.x) * k;
    player.head.y += (desiredY - player.head.y) * k;

    // Stabilize spine
    player.spine.x += (desiredX - player.spine.x) * k;
}

function checkKnockout() {
    // Simple win condition: Head touches floor
    if (p1.head.y > height - 30) {
        resetRound(2);
    }
    if (p2.head.y > height - 30) {
        resetRound(1);
    }
}

function resetRound(winner) {
    gameActive = false;
    if (winner === 1) p1Score++;
    else p2Score++;

    document.getElementById("p1-score").innerText = p1Score;
    document.getElementById("p2-score").innerText = p2Score;

    setTimeout(() => {
        let w1 = document.getElementById("p1-weapon").value;
        let w2 = document.getElementById("p2-weapon").value;
        initGame(w1, w2);
    }, 2000); // 2s pause
}

function update() {
    if (!gameActive) return;

    // 1. Update Physics
    for (let p of points) p.update();
    for (let i = 0; i < 5; i++) {
        for (let s of sticks) s.update();
        for (let p of points) p.constrain();
    }

    // 2. Balancing
    applyStandForce(p1);
    applyStandForce(p2);

    // 3. Controls
    // P1 (WASD)
    let force = 2; // Movement force
    if (keys["KeyW"]) { // Jump/Lift
        p1.head.y -= force;
        p1.lHand.y -= force * 2; p1.rHand.y -= force * 2; // Hands up
    }
    if (keys["KeyA"]) { // Left
        p1.head.x -= force; p1.pelvis.x -= force;
    }
    if (keys["KeyD"]) { // Right
        p1.head.x += force; p1.pelvis.x += force;
    }
    if (keys["KeyS"]) { // Crouch/Smash
        p1.pelvis.y += force;
        p1.rHand.y += force * 3; // Weapon smash
    }

    // P2 (Arrows)
    if (keys["ArrowUp"]) {
        p2.head.y -= force;
        p2.lHand.y -= force * 2; p2.rHand.y -= force * 2;
    }
    if (keys["ArrowLeft"]) {
        p2.head.x -= force; p2.pelvis.x -= force;
    }
    if (keys["ArrowRight"]) {
        p2.head.x += force; p2.pelvis.x += force;
    }
    if (keys["ArrowDown"]) {
        p2.pelvis.y += force;
        p2.rHand.y += force * 3;
    }

    // 4. Logic
    checkKnockout();
}

function render() {
    ctx.clearRect(0, 0, width, height);

    // Floor
    ctx.fillStyle = "#888";
    ctx.fillRect(0, height - 20, width, 20);

    // Sticks
    for (let s of sticks) s.draw();

    // Heads (Draw over sticks)
    const drawHead = (p, col) => {
        ctx.beginPath();
        ctx.arc(p.head.x, p.head.y, 15, 0, Math.PI * 2);
        ctx.fillStyle = col;
        ctx.fill();
        ctx.strokeStyle = "#000";
        ctx.stroke();
        // Eyes
        ctx.fillStyle = "white";
        ctx.beginPath(); ctx.arc(p.head.x - 5, p.head.y - 2, 4, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(p.head.x + 5, p.head.y - 2, 4, 0, Math.PI * 2); ctx.fill();
    };

    if (p1) drawHead(p1, "#2ecc71");
    if (p2) drawHead(p2, "#e74c3c");
}

function loop() {
    update();
    render();
    requestAnimationFrame(loop);
}

// Inputs
let keys = {};
document.addEventListener("keydown", e => keys[e.code] = true);
document.addEventListener("keyup", e => keys[e.code] = false);
