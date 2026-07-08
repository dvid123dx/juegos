"use strict";

/* =========================================================
   GRAVIDAD — Asteroids monocromo con pozos de gravedad
   Canvas 2D puro, sin dependencias externas.
   ========================================================= */

const gameCanvas = document.getElementById("game");
const bgCanvas = document.getElementById("bg");
const gctx = gameCanvas.getContext("2d");
const bctx = bgCanvas.getContext("2d");

const overlay = document.getElementById("overlay");
const titleEl = document.getElementById("title");
const subtitleEl = document.getElementById("subtitle");
const msgEl = document.getElementById("msg");
const instructionsEl = document.getElementById("instructions");
const warnEl = document.getElementById("warn");
const scoreEl = document.getElementById("score");
const waveEl = document.getElementById("wave");
const livesIconsEl = document.getElementById("lives-icons");
const touchControls = document.getElementById("touch-controls");

let W = 0, H = 0, DPR = 1;

function resize() {
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  W = window.innerWidth;
  H = window.innerHeight;
  for (const [cv, ctx] of [[gameCanvas, gctx], [bgCanvas, bctx]]) {
    cv.width = W * DPR;
    cv.height = H * DPR;
    cv.style.width = W + "px";
    cv.style.height = H + "px";
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  buffer.width = W * DPR;
  buffer.height = H * DPR;
  bufferCtx.setTransform(DPR, 0, 0, DPR, 0, 0);
}

// offscreen buffer used for the bloom / blur composite pass
const buffer = document.createElement("canvas");
const bufferCtx = buffer.getContext("2d");

window.addEventListener("resize", resize);

/* ---------------- utility ---------------- */

const TAU = Math.PI * 2;

function rand(a, b) { return a + Math.random() * (b - a); }
function randInt(a, b) { return Math.floor(rand(a, b + 1)); }
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

// shortest signed delta on a wrapped torus axis
function wrapDelta(d, size) {
  if (d > size / 2) d -= size;
  if (d < -size / 2) d += size;
  return d;
}

function wrapPos(v, size) {
  if (v < 0) return v + size;
  if (v >= size) return v - size;
  return v;
}

function circleHit(ax, ay, ar, bx, by, br) {
  const dx = wrapDelta(ax - bx, W);
  const dy = wrapDelta(ay - by, H);
  const r = ar + br;
  return dx * dx + dy * dy <= r * r;
}

/* ---------------- input ---------------- */

const keys = {};
const touchState = { left: false, right: false, thrust: false, fire: false };

window.addEventListener("keydown", (e) => {
  keys[e.code] = true;
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(e.code)) e.preventDefault();
  if (state === "start") startGame();
  else if (state === "gameover" && e.code === "Enter") startGame();
  if (e.code === "KeyP" && state === "playing") togglePause();
  else if (e.code === "KeyP" && state === "paused") togglePause();
});
window.addEventListener("keyup", (e) => { keys[e.code] = false; });

overlay.addEventListener("click", () => {
  if (state === "start") startGame();
  else if (state === "gameover") startGame();
});

function isTouchDevice() {
  return "ontouchstart" in window || navigator.maxTouchPoints > 0;
}

if (isTouchDevice()) {
  touchControls.classList.add("active");
}

function bindHold(el, prop) {
  const on = (e) => { e.preventDefault(); touchState[prop] = true; };
  const off = (e) => { e.preventDefault(); touchState[prop] = false; };
  el.addEventListener("touchstart", on, { passive: false });
  el.addEventListener("touchend", off, { passive: false });
  el.addEventListener("touchcancel", off, { passive: false });
  el.addEventListener("mousedown", on);
  el.addEventListener("mouseup", off);
  el.addEventListener("mouseleave", off);
}
bindHold(document.getElementById("tc-left"), "left");
bindHold(document.getElementById("tc-right"), "right");
bindHold(document.getElementById("tc-thrust"), "thrust");
bindHold(document.getElementById("tc-fire"), "fire");

document.addEventListener("touchstart", () => {
  if (state === "start") startGame();
  else if (state === "gameover") startGame();
}, { passive: true });

function left() { return keys["ArrowLeft"] || keys["KeyA"] || touchState.left; }
function right() { return keys["ArrowRight"] || keys["KeyD"] || touchState.right; }
function thrusting() { return keys["ArrowUp"] || keys["KeyW"] || touchState.thrust; }
function firing() { return keys["Space"] || touchState.fire; }

/* ---------------- starfield background ---------------- */

let stars = [];
function initStars() {
  stars = [];
  const count = Math.floor((W * H) / 3200);
  for (let i = 0; i < count; i++) {
    stars.push({
      x: rand(0, W),
      y: rand(0, H),
      r: rand(0.3, 1.6),
      tw: rand(0, TAU),
      speed: rand(0.15, 0.6),
    });
  }
}

function drawStars(dt, parallaxX, parallaxY) {
  bctx.fillStyle = "#000";
  bctx.fillRect(0, 0, W, H);
  for (const s of stars) {
    s.tw += dt * s.speed;
    const flicker = 0.55 + 0.45 * Math.sin(s.tw);
    s.x -= parallaxX * 0.02 * s.r;
    s.y -= parallaxY * 0.02 * s.r;
    s.x = wrapPos(s.x, W);
    s.y = wrapPos(s.y, H);
    bctx.beginPath();
    bctx.fillStyle = `rgba(255,255,255,${flicker * 0.85})`;
    bctx.arc(s.x, s.y, s.r, 0, TAU);
    bctx.fill();
  }
}

/* ---------------- entities ---------------- */

let ship, asteroids, bullets, enemies, enemyBullets, particles, wells, shockwaves;
let score = 0, lives = 3, wave = 1, state = "start";
let shakeTime = 0, shakeMag = 0;
let respawnInvuln = 0;
let fireCooldown = 0;
let spawnEnemyTimer = 0;

function makeShip() {
  return {
    x: W / 2, y: H / 2,
    vx: 0, vy: 0,
    angle: -Math.PI / 2,
    radius: 13,
    thrusting: false,
    alive: true,
  };
}

function spawnAsteroid(size, x, y) {
  const speeds = { l: rand(0.4, 1.0), m: rand(0.7, 1.6), s: rand(1.1, 2.2) };
  const radii = { l: 46, m: 26, s: 14 };
  const a = {
    x: x ?? rand(0, W),
    y: y ?? rand(0, H),
    size,
    radius: radii[size],
    angle: rand(0, TAU),
    vx: 0, vy: 0,
    spin: rand(-0.02, 0.02),
    rot: rand(0, TAU),
    verts: makeAsteroidShape(radii[size]),
  };
  const dir = rand(0, TAU);
  const sp = speeds[size];
  a.vx = Math.cos(dir) * sp;
  a.vy = Math.sin(dir) * sp;
  return a;
}

function makeAsteroidShape(baseR) {
  const n = randInt(9, 14);
  const verts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU;
    const r = baseR * rand(0.72, 1.18);
    verts.push({ a, r });
  }
  return verts;
}

function spawnWave(n) {
  asteroids = [];
  for (let i = 0; i < n; i++) {
    let x, y;
    do {
      x = rand(0, W); y = rand(0, H);
    } while (Math.hypot(wrapDelta(x - ship.x, W), wrapDelta(y - ship.y, H)) < 180);
    asteroids.push(spawnAsteroid("l", x, y));
  }
}

function spawnWells() {
  wells = [];
  const n = randInt(1, 2);
  const safeDist = 300; // keep wells away from the ship's spawn point at screen center
  for (let i = 0; i < n; i++) {
    let x, y, tries = 0;
    do {
      x = rand(W * 0.15, W * 0.85);
      y = rand(H * 0.15, H * 0.85);
      tries++;
    } while (Math.hypot(x - W / 2, y - H / 2) < safeDist && tries < 30);
    wells.push({
      x, y,
      radius: rand(16, 22),
      mass: rand(1400, 2200),
      vx: rand(-0.15, 0.15),
      vy: rand(-0.15, 0.15),
      spin: rand(0, TAU),
    });
  }
}

function spawnEnemy() {
  const edge = randInt(0, 3);
  let x, y;
  if (edge === 0) { x = 0; y = rand(0, H); }
  else if (edge === 1) { x = W; y = rand(0, H); }
  else if (edge === 2) { x = rand(0, W); y = 0; }
  else { x = rand(0, W); y = H; }
  enemies.push({
    x, y, vx: 0, vy: 0,
    radius: 15,
    angle: 0,
    fireTimer: rand(60, 120),
    steerTimer: 0,
    steerAngle: rand(0, TAU),
  });
}

function resetGame() {
  ship = makeShip();
  bullets = [];
  enemies = [];
  enemyBullets = [];
  particles = [];
  shockwaves = [];
  score = 0;
  lives = 3;
  wave = 1;
  respawnInvuln = 120;
  spawnWells();
  spawnWave(4);
  updateHud();
}

function startGame() {
  state = "playing";
  overlay.classList.add("hidden");
  resetGame();
}

function togglePause() {
  state = state === "playing" ? "paused" : "playing";
  if (state === "paused") {
    overlay.classList.remove("hidden");
    titleEl.textContent = "PAUSA";
    subtitleEl.textContent = "el vacío espera";
    msgEl.textContent = "Pulsa P para continuar";
    instructionsEl.style.display = "grid";
    warnEl.style.display = "block";
  } else {
    overlay.classList.add("hidden");
  }
}

function gameOver() {
  state = "gameover";
  titleEl.textContent = "FIN";
  subtitleEl.textContent = "consumido por el vacío";
  msgEl.textContent = "Pulsa Enter, clic o toca para reintentar";
  instructionsEl.style.display = "none";
  warnEl.style.display = "none";
  overlay.classList.remove("hidden");
}

function addScore(v) {
  score += v;
  updateHud();
}

function updateHud() {
  scoreEl.textContent = "PUNTOS: " + String(score).padStart(4, "0");
  waveEl.textContent = "OLA: " + wave;
  livesIconsEl.innerHTML = "";
  for (let i = 0; i < lives; i++) {
    const s = document.createElement("span");
    s.textContent = "▲";
    livesIconsEl.appendChild(s);
  }
}

function shake(mag, time) {
  shakeMag = Math.max(shakeMag, mag);
  shakeTime = Math.max(shakeTime, time);
}

/* ---------------- particles & effects ---------------- */

function burst(x, y, count, speedMin, speedMax, life) {
  for (let i = 0; i < count; i++) {
    const a = rand(0, TAU);
    const sp = rand(speedMin, speedMax);
    particles.push({
      x, y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp,
      life: rand(life * 0.6, life),
      maxLife: life,
      r: rand(1, 2.6),
    });
  }
}

function addShockwave(x, y, maxR, life) {
  shockwaves.push({ x, y, r: 4, maxR, life, maxLife: life });
}

/* ---------------- gravity ---------------- */

function applyGravity(obj, factor = 1) {
  for (const w of wells) {
    const dx = wrapDelta(w.x - obj.x, W);
    const dy = wrapDelta(w.y - obj.y, H);
    let dist = Math.hypot(dx, dy);
    dist = Math.max(dist, w.radius * 1.6);
    const force = Math.min((w.mass / (dist * dist)) * factor, 0.12);
    obj.vx += (dx / dist) * force;
    obj.vy += (dy / dist) * force;
  }
}

function eatenByWell(obj) {
  for (const w of wells) {
    const dx = wrapDelta(w.x - obj.x, W);
    const dy = wrapDelta(w.y - obj.y, H);
    if (Math.hypot(dx, dy) < w.radius) return true;
  }
  return false;
}

/* ---------------- update ---------------- */

let lastTime = performance.now();

function update(dt) {
  const dtn = dt / (1000 / 60); // normalize to ~60fps steps

  if (shakeTime > 0) shakeTime -= dt;

  updateShip(dtn);
  updateBullets(dtn);
  updateAsteroids(dtn);
  updateEnemies(dtn);
  updateEnemyBullets(dtn);
  updateParticles(dtn);
  updateWells(dtn);
  updateShockwaves(dtn);

  if (respawnInvuln > 0) respawnInvuln -= dtn;

  spawnEnemyTimer -= dtn;
  if (spawnEnemyTimer <= 0 && enemies.length < 1 + Math.floor(wave / 3)) {
    spawnEnemy();
    spawnEnemyTimer = rand(400, 700);
  }

  if (asteroids.length === 0) {
    wave++;
    spawnWave(Math.min(4 + wave, 11));
    updateHud();
  }
}

function updateShip(dtn) {
  if (!ship.alive) return;

  if (left()) ship.angle -= 0.065 * dtn;
  if (right()) ship.angle += 0.065 * dtn;

  ship.thrusting = thrusting();
  if (ship.thrusting) {
    ship.vx += Math.cos(ship.angle) * 0.11 * dtn;
    ship.vy += Math.sin(ship.angle) * 0.11 * dtn;
    if (Math.random() < 0.9) {
      const back = ship.angle + Math.PI;
      const spread = rand(-0.35, 0.35);
      particles.push({
        x: ship.x + Math.cos(back) * 14,
        y: ship.y + Math.sin(back) * 14,
        vx: Math.cos(back + spread) * rand(1, 2.4) + ship.vx * 0.3,
        vy: Math.sin(back + spread) * rand(1, 2.4) + ship.vy * 0.3,
        life: rand(12, 24),
        maxLife: 24,
        r: rand(1, 2.2),
      });
    }
  }

  applyGravity(ship, 1);

  ship.vx *= 0.997;
  ship.vy *= 0.997;
  ship.x = wrapPos(ship.x + ship.vx * dtn, W);
  ship.y = wrapPos(ship.y + ship.vy * dtn, H);

  fireCooldown -= dtn;
  if (firing() && fireCooldown <= 0) {
    fireCooldown = 9;
    bullets.push({
      x: ship.x + Math.cos(ship.angle) * ship.radius,
      y: ship.y + Math.sin(ship.angle) * ship.radius,
      vx: ship.vx + Math.cos(ship.angle) * 7,
      vy: ship.vy + Math.sin(ship.angle) * 7,
      life: 70,
    });
  }

  if (eatenByWell(ship) && respawnInvuln <= 0) {
    killShip(true);
    return;
  }

  if (respawnInvuln <= 0) {
    for (const a of asteroids) {
      if (circleHit(ship.x, ship.y, ship.radius * 0.7, a.x, a.y, a.radius * 0.85)) {
        killShip(false);
        explodeAsteroid(a, false);
        asteroids.splice(asteroids.indexOf(a), 1);
        break;
      }
    }
  }
  if (ship.alive && respawnInvuln <= 0) {
    for (const e of enemies) {
      if (circleHit(ship.x, ship.y, ship.radius * 0.7, e.x, e.y, e.radius * 0.85)) {
        killShip(false);
        break;
      }
    }
  }
}

function killShip(sucked) {
  ship.alive = false;
  lives--;
  updateHud();
  burst(ship.x, ship.y, sucked ? 40 : 26, 1, sucked ? 5 : 3.5, 40);
  addShockwave(ship.x, ship.y, sucked ? 90 : 60, 30);
  shake(sucked ? 14 : 9, 300);
  if (lives <= 0) {
    setTimeout(() => gameOver(), 700);
  } else {
    setTimeout(() => {
      ship = makeShip();
      respawnInvuln = 150;
    }, 900);
  }
}

function updateBullets(dtn) {
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    applyGravity(b, 0.5);
    b.x = wrapPos(b.x + b.vx * dtn, W);
    b.y = wrapPos(b.y + b.vy * dtn, H);
    b.life -= dtn;
    if (b.life <= 0 || eatenByWell(b)) { bullets.splice(i, 1); continue; }

    let hit = false;
    for (let j = asteroids.length - 1; j >= 0; j--) {
      const a = asteroids[j];
      if (circleHit(b.x, b.y, 2, a.x, a.y, a.radius * 0.9)) {
        explodeAsteroid(a, true);
        asteroids.splice(j, 1);
        hit = true;
        break;
      }
    }
    if (!hit) {
      for (let j = enemies.length - 1; j >= 0; j--) {
        const e = enemies[j];
        if (circleHit(b.x, b.y, 2, e.x, e.y, e.radius * 0.9)) {
          burst(e.x, e.y, 30, 1, 4, 34);
          addShockwave(e.x, e.y, 70, 26);
          shake(7, 200);
          enemies.splice(j, 1);
          addScore(200);
          hit = true;
          break;
        }
      }
    }
    if (hit) bullets.splice(i, 1);
  }
}

function explodeAsteroid(a, scored) {
  burst(a.x, a.y, a.size === "l" ? 22 : a.size === "m" ? 16 : 10, 0.6, 3.2, 32);
  addShockwave(a.x, a.y, a.radius * 1.6, 22);
  shake(a.size === "l" ? 6 : 3, 150);
  if (scored) {
    addScore(a.size === "l" ? 20 : a.size === "m" ? 50 : 100);
  }
  if (a.size !== "s") {
    const next = a.size === "l" ? "m" : "s";
    for (let i = 0; i < 2; i++) {
      const na = spawnAsteroid(next, a.x, a.y);
      na.vx += a.vx * 0.5 + rand(-0.5, 0.5);
      na.vy += a.vy * 0.5 + rand(-0.5, 0.5);
      asteroids.push(na);
    }
  }
}

function updateAsteroids(dtn) {
  for (const a of asteroids) {
    applyGravity(a, 0.8);
    a.rot += a.spin * dtn;
    a.x = wrapPos(a.x + a.vx * dtn, W);
    a.y = wrapPos(a.y + a.vy * dtn, H);
  }
  for (let i = asteroids.length - 1; i >= 0; i--) {
    if (eatenByWell(asteroids[i])) {
      burst(asteroids[i].x, asteroids[i].y, 14, 0.5, 2, 20);
      asteroids.splice(i, 1);
    }
  }
}

function updateEnemies(dtn) {
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    applyGravity(e, 0.6);

    e.steerTimer -= dtn;
    if (e.steerTimer <= 0) {
      const toShip = Math.atan2(wrapDelta(ship.y - e.y, H), wrapDelta(ship.x - e.x, W));
      e.steerAngle = toShip + rand(-0.6, 0.6);
      e.steerTimer = rand(40, 90);
    }
    e.vx += Math.cos(e.steerAngle) * 0.035 * dtn;
    e.vy += Math.sin(e.steerAngle) * 0.035 * dtn;
    e.vx *= 0.995; e.vy *= 0.995;
    e.x = wrapPos(e.x + e.vx * dtn, W);
    e.y = wrapPos(e.y + e.vy * dtn, H);

    e.fireTimer -= dtn;
    if (e.fireTimer <= 0 && ship.alive) {
      e.fireTimer = rand(70, 130);
      const a = Math.atan2(wrapDelta(ship.y - e.y, H), wrapDelta(ship.x - e.x, W));
      enemyBullets.push({
        x: e.x, y: e.y,
        vx: Math.cos(a) * 4.2, vy: Math.sin(a) * 4.2,
        life: 90,
      });
    }

    if (eatenByWell(e)) {
      burst(e.x, e.y, 16, 0.6, 2.4, 22);
      enemies.splice(i, 1);
    }
  }
}

function updateEnemyBullets(dtn) {
  for (let i = enemyBullets.length - 1; i >= 0; i--) {
    const b = enemyBullets[i];
    applyGravity(b, 0.5);
    b.x = wrapPos(b.x + b.vx * dtn, W);
    b.y = wrapPos(b.y + b.vy * dtn, H);
    b.life -= dtn;
    if (b.life <= 0 || eatenByWell(b)) { enemyBullets.splice(i, 1); continue; }
    if (ship.alive && respawnInvuln <= 0 && circleHit(b.x, b.y, 2, ship.x, ship.y, ship.radius * 0.7)) {
      enemyBullets.splice(i, 1);
      killShip(false);
    }
  }
}

function updateParticles(dtn) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x = wrapPos(p.x + p.vx * dtn, W);
    p.y = wrapPos(p.y + p.vy * dtn, H);
    p.vx *= 0.98; p.vy *= 0.98;
    p.life -= dtn;
    if (p.life <= 0) particles.splice(i, 1);
  }
}

function updateWells(dtn) {
  for (const w of wells) {
    w.spin += 0.02 * dtn;
    w.x = wrapPos(w.x + w.vx * dtn, W);
    w.y = wrapPos(w.y + w.vy * dtn, H);
  }
}

function updateShockwaves(dtn) {
  for (let i = shockwaves.length - 1; i >= 0; i--) {
    const s = shockwaves[i];
    s.life -= dtn;
    s.r += ((s.maxR - s.r) * 0.15) * dtn;
    if (s.life <= 0) shockwaves.splice(i, 1);
  }
}

/* ---------------- render ---------------- */

function render() {
  const ctx = bufferCtx;
  ctx.clearRect(0, 0, W, H);
  ctx.strokeStyle = "#fff";
  ctx.fillStyle = "#fff";
  ctx.lineWidth = 2.1;
  ctx.lineJoin = "round";

  drawWells(ctx);
  drawShockwaves(ctx);
  drawParticles(ctx);
  drawAsteroids(ctx);
  drawEnemies(ctx);
  drawBullets(ctx);
  drawEnemyBullets(ctx);
  if (ship.alive) drawShip(ctx);

  // composite the buffer onto the visible canvas with a layered blur = bloom
  let ox = 0, oy = 0;
  if (shakeTime > 0) {
    const m = shakeMag * (shakeTime / 300);
    ox = rand(-m, m);
    oy = rand(-m, m);
  }

  gctx.clearRect(0, 0, W, H);
  gctx.fillStyle = "rgba(0,0,0,1)";
  gctx.fillRect(0, 0, W, H);

  gctx.save();
  gctx.translate(ox, oy);

  gctx.globalCompositeOperation = "lighter";
  gctx.filter = "none";
  gctx.globalAlpha = 1;
  gctx.drawImage(buffer, 0, 0, W, H);

  gctx.filter = "blur(3px)";
  gctx.globalAlpha = 0.85;
  gctx.drawImage(buffer, 0, 0, W, H);

  gctx.filter = "blur(9px)";
  gctx.globalAlpha = 0.65;
  gctx.drawImage(buffer, 0, 0, W, H);

  gctx.filter = "blur(22px)";
  gctx.globalAlpha = 0.55;
  gctx.drawImage(buffer, 0, 0, W, H);

  gctx.filter = "blur(42px)";
  gctx.globalAlpha = 0.4;
  gctx.drawImage(buffer, 0, 0, W, H);

  gctx.restore();
  gctx.filter = "none";
  gctx.globalAlpha = 1;
  gctx.globalCompositeOperation = "source-over";
}

function drawShip(ctx) {
  const blinking = respawnInvuln > 0 && Math.floor(respawnInvuln / 8) % 2 === 0;
  if (blinking) return;
  const thrustStretch = ship.thrusting ? rand(0, 8) : 0;
  for (const [ox, oy] of edgeOffsets(ship.x, ship.y, ship.radius + 20)) {
    ctx.save();
    ctx.translate(ship.x + ox, ship.y + oy);
    ctx.rotate(ship.angle);
    ctx.beginPath();
    ctx.moveTo(16, 0);
    ctx.lineTo(-12, -10);
    ctx.lineTo(-7, 0);
    ctx.lineTo(-12, 10);
    ctx.closePath();
    ctx.stroke();

    if (ship.thrusting) {
      ctx.beginPath();
      ctx.moveTo(-7, -5);
      ctx.lineTo(-18 - thrustStretch, 0);
      ctx.lineTo(-7, 5);
      ctx.stroke();
    }
    ctx.restore();
  }
}

function drawAsteroidShape(ctx, a) {
  ctx.save();
  ctx.translate(a.x, a.y);
  ctx.rotate(a.rot);
  ctx.beginPath();
  a.verts.forEach((v, i) => {
    const x = Math.cos(v.a) * v.r;
    const y = Math.sin(v.a) * v.r;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

function drawAsteroids(ctx) {
  for (const a of asteroids) {
    for (const [ox, oy] of edgeOffsets(a.x, a.y, a.radius)) {
      drawAsteroidShape(ctx, { ...a, x: a.x + ox, y: a.y + oy });
    }
  }
}

// returns offsets (including [0,0]) needed so a body straddling a torus
// edge also renders its wrapped ghost copy on the opposite side
function edgeOffsets(x, y, r) {
  const offsets = [[0, 0]];
  const left = x - r < 0, rightEdge = x + r > W;
  const top = y - r < 0, bottom = y + r > H;
  if (left) offsets.push([W, 0]);
  if (rightEdge) offsets.push([-W, 0]);
  if (top) offsets.push([0, H]);
  if (bottom) offsets.push([0, -H]);
  if (left && top) offsets.push([W, H]);
  if (left && bottom) offsets.push([W, -H]);
  if (rightEdge && top) offsets.push([-W, H]);
  if (rightEdge && bottom) offsets.push([-W, -H]);
  return offsets;
}

function drawEnemies(ctx) {
  for (const e of enemies) {
    for (const [ox, oy] of edgeOffsets(e.x, e.y, e.radius)) {
      ctx.save();
      ctx.translate(e.x + ox, e.y + oy);
      ctx.beginPath();
      ctx.ellipse(0, 0, 15, 7, 0, 0, TAU);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(0, -3, 7, 6, 0, Math.PI, TAU);
      ctx.stroke();
      ctx.restore();
    }
  }
}

function drawBullets(ctx) {
  ctx.fillStyle = "#fff";
  for (const b of bullets) {
    ctx.beginPath();
    ctx.arc(b.x, b.y, 2.1, 0, TAU);
    ctx.fill();
  }
}

function drawEnemyBullets(ctx) {
  ctx.fillStyle = "#ddd";
  for (const b of enemyBullets) {
    ctx.beginPath();
    ctx.arc(b.x, b.y, 2.4, 0, TAU);
    ctx.fill();
  }
}

function drawParticles(ctx) {
  for (const p of particles) {
    const alpha = clamp(p.life / p.maxLife, 0, 1);
    ctx.beginPath();
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.arc(p.x, p.y, p.r, 0, TAU);
    ctx.fill();
  }
}

function drawWells(ctx) {
  for (const w of wells) {
    ctx.save();
    ctx.translate(w.x, w.y);
    // accretion rings
    for (let i = 0; i < 4; i++) {
      const rr = w.radius + i * 8 + Math.sin(w.spin + i) * 2;
      ctx.beginPath();
      ctx.globalAlpha = 0.45 - i * 0.09;
      ctx.ellipse(0, 0, rr * 1.6, rr * 0.6, w.spin * 0.4 + i * 0.3, 0, TAU);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    // dark core (a hole punched in the glow)
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.arc(0, 0, w.radius, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.beginPath();
    ctx.arc(0, 0, w.radius, 0, TAU);
    ctx.stroke();
    ctx.restore();
  }
}

function drawShockwaves(ctx) {
  for (const s of shockwaves) {
    const alpha = clamp(s.life / s.maxLife, 0, 1);
    ctx.beginPath();
    ctx.globalAlpha = alpha * 0.8;
    ctx.arc(s.x, s.y, s.r, 0, TAU);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}

/* ---------------- main loop ---------------- */

function frame(now) {
  const dt = Math.min(now - lastTime, 50);
  lastTime = now;

  const parallaxX = ship && ship.alive ? ship.vx : 0;
  const parallaxY = ship && ship.alive ? ship.vy : 0;
  drawStars(dt / 16.67, parallaxX, parallaxY);

  if (state === "playing") {
    update(dt);
  }
  if (state === "playing" || state === "paused") {
    render();
  }
  requestAnimationFrame(frame);
}

/* ---------------- boot ---------------- */

resize();
initStars();
ship = makeShip();
asteroids = [];
bullets = [];
enemies = [];
enemyBullets = [];
particles = [];
wells = [];
shockwaves = [];
spawnWells();
spawnWave(4);
updateHud();

window.addEventListener("resize", () => { initStars(); });

requestAnimationFrame(frame);
