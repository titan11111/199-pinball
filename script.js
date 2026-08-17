(() => {
  'use strict';

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const stage = document.getElementById('stage');
  const scoreEl = document.getElementById('score');
  const topEl = document.getElementById('topScore');
  const ballsEl = document.getElementById('balls');
  const startEl = document.getElementById('start');
  const muteBtn = document.getElementById('muteBtn');

  const W = 250;
  const H = 560;
  let dpr = 1;

  const C = {
    bg: '#000000',
    rail: '#883040',
    railHi: '#fcfcfc',
    pink: '#fc78b0',
    cyan: '#3cdcfc',
    yellow: '#f8b800',
    green: '#58d830',
    gold: '#f8d838',
    gray: '#a0a0b0',
    hole: '#703018',
    text: '#fcfcfc'
  };

  const GLYPH = {
    '0': '111101101101111',
    '1': '010110010010111',
    '2': '111001111100111',
    '3': '111001111001111',
    '4': '101101111001001',
    '5': '111100111001111',
    '6': '111100111101111',
    '7': '111001001001001',
    '8': '111101111101111',
    '9': '111101111001111',
    A: '010101111101101',
    B: '110101110101110',
    E: '111100110100111',
    G: '011100101101011',
    I: '111010010010111',
    L: '100100100100111',
    M: '101111101101101',
    N: '101111111101101',
    O: '010101101101010',
    P: '111101111100100',
    R: '110101110101101',
    S: '011100010001110',
    T: '111010010010010',
    U: '101101101101111',
    V: '101101101010010',
    ' ': '000000000000000'
  };

  function ptext(str, x, y, color, scale) {
    const s = scale || 1;
    ctx.fillStyle = color;
    let ox = x | 0;
    const oy = y | 0;
    for (const ch of str) {
      const g = GLYPH[ch] || GLYPH[' '];
      for (let i = 0; i < 15; i++) {
        if (g[i] === '1') {
          const gx = i % 3;
          const gy = (i / 3) | 0;
          ctx.fillRect(ox + gx * s, oy + gy * s, s, s);
        }
      }
      ox += 4 * s;
    }
  }

  function resize() {
    const r = stage.getBoundingClientRect();
    dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    canvas.width = Math.max(1, Math.round(r.width * dpr));
    canvas.height = Math.max(1, Math.round(r.height * dpr));
    const s = Math.min(canvas.width / W, canvas.height / H);
    const ox = (canvas.width - W * s) / 2;
    const oy = (canvas.height - H * s) / 2;
    ctx.setTransform(s, 0, 0, s, ox, oy);
    ctx.imageSmoothingEnabled = false;
  }
  addEventListener('resize', resize);
  addEventListener('orientationchange', () => setTimeout(resize, 80));
  resize();

  const TL = 10;
  const TR = 218;
  const PR = 242;
  const PX = 230;
  const TT = 18;
  const TB = 548;

  const walls = [
    [TL, 78, TL, 430],
    [TL, 78, 28, 42],
    [28, 42, 62, TT],
    [62, TT, TR - 8, TT],
    [TR - 8, TT, TR, 40],
    [PR, 40, PR, TB],
    [PR, TB, TR, TB],
    [TR, 58, TR, 430],
    [TL, 430, 42, 500],
    [42, 500, 70, 526],
    [TR, 430, 186, 500],
    [186, 500, 158, 526],
    [78, 18, 78, 64],
    [128, 18, 128, 64]
  ];

  const slings = [
    { a: [22, 438], b: [72, 514], kx: 200, ky: -260 },
    { a: [206, 438], b: [156, 514], kx: -200, ky: -260 }
  ];
  const laneLock = [false, false, false];

  const lanePosts = [
    { x: 78, y: 48, r: 5 },
    { x: 128, y: 48, r: 5 }
  ];

  const bumpers = [
    { x: 114, y: 142, r: 22, color: C.pink, value: 100, flash: 0, label: '100' },
    { x: 64, y: 168, r: 13, color: C.gray, value: 50, flash: 0, label: '' },
    { x: 164, y: 168, r: 13, color: C.gray, value: 50, flash: 0, label: '' }
  ];

  const targets = [
    { x: 18, y: 96, w: 8, h: 16, on: false },
    { x: 18, y: 118, w: 8, h: 16, on: false },
    { x: 18, y: 140, w: 8, h: 16, on: false }
  ];

  const laneLights = [0, 1, 2, 3, 4, 5].map((i) => ({
    x: 24 + (i % 2) * 4,
    y: 188 + i * 14,
    on: false
  }));

  const lanes = [
    { x0: 18, x1: 74, y: 40, value: 500, on: false },
    { x0: 82, x1: 124, y: 40, value: 1000, on: false },
    { x0: 132, x1: 210, y: 40, value: 500, on: false }
  ];

  const slot = {
    x: 58,
    y: 236,
    w: 112,
    h: 28,
    target: { x: 96, y: 224, w: 36, h: 10 },
    reels: [0, 1, 2],
    spin: 0,
    flash: 0
  };
  const hole = { x: 188, y: 498, r: 11, hold: 0 };
  const upPost = { x: 114, y: 538, r: 6, up: false };

  const flippers = {
    left: { px: 68, py: 522, len: 50, angle: 0.38, base: 0.38, up: -0.58, pressed: false, omega: 0 },
    right: { px: 160, py: 522, len: 50, angle: Math.PI - 0.38, base: Math.PI - 0.38, up: Math.PI + 0.58, pressed: false, omega: 0 }
  };

  const ball = {
    x: PX, y: 470, vx: 0, vy: 0, r: 6,
    active: false, captured: false, trail: []
  };

  const gravity = 620;
  const FIXED = 1 / 120;
  let accumulator = 0;
  let last = performance.now();
  let score = 0;
  let topScore = 0;
  let balls = 3;
  let gameOver = false;
  let started = false;
  let launchCharge = 0;
  let charging = false;
  let muted = false;
  let audioCtx = null;
  let bgmTimer = 0;
  let bgmStep = 0;

  try {
    topScore = Math.max(0, parseInt(localStorage.getItem('pinball-top') || '0', 10) || 0);
  } catch (_e) {
    topScore = 0;
  }

  function pad(n, w) {
    return Math.max(0, Math.floor(n)).toString().padStart(w, '0');
  }

  function setScore(v) {
    score = Math.max(0, Math.floor(v));
    scoreEl.textContent = pad(score, 6);
    if (score > topScore) {
      topScore = score;
      topEl.textContent = pad(topScore, 6);
      try { localStorage.setItem('pinball-top', String(topScore)); } catch (_e) { /* ignore */ }
    }
  }

  function addScore(n) {
    setScore(score + n);
  }

  const lastSfx = Object.create(null);

  function getAudio() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    if (!audioCtx) {
      audioCtx = new AC();
      const silent = audioCtx.createBuffer(1, 1, 22050);
      const src = audioCtx.createBufferSource();
      src.buffer = silent;
      src.connect(audioCtx.destination);
      src.start(0);
    }
    return audioCtx;
  }

  function unlockAudio() {
    const a = getAudio();
    if (!a) return;
    if (a.state === 'suspended') a.resume().catch(() => {});
  }

  function beep(freq, dur, type, vol) {
    unlockAudio();
    if (muted || !audioCtx) return;
    const a = audioCtx;
    const t = a.currentTime;
    const o = a.createOscillator();
    const g = a.createGain();
    const f = a.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 4200;
    o.type = type || 'square';
    o.frequency.setValueAtTime(Math.max(40, freq), t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.001, vol || 0.05), t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(f);
    f.connect(g);
    g.connect(a.destination);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  function sfx(kind) {
    unlockAudio();
    if (muted || !audioCtx) return;
    const now = audioCtx.currentTime;
    const cd = { rail: 0.04, sling: 0.09, bump: 0.05, flip: 0.07, post: 0.08, target: 0.08, hole: 0.2 }[kind] || 0.05;
    if (now - (lastSfx[kind] || 0) < cd) return;
    lastSfx[kind] = now;
    if (kind === 'rail') beep(240, 0.04, 'triangle', 0.03);
    else if (kind === 'sling') { beep(720, 0.07, 'square', 0.055); beep(180, 0.08, 'sawtooth', 0.03); }
    else if (kind === 'bump') { beep(880, 0.05, 'square', 0.06); beep(440, 0.08, 'triangle', 0.04); }
    else if (kind === 'flip') beep(560, 0.045, 'square', 0.05);
    else if (kind === 'post') beep(980, 0.04, 'square', 0.04);
    else if (kind === 'target') beep(640, 0.07, 'square', 0.05);
    else if (kind === 'hole') beep(140, 0.16, 'sawtooth', 0.05);
    else if (kind === 'drain') { beep(180, 0.22, 'sawtooth', 0.07); beep(90, 0.28, 'triangle', 0.04); }
    else if (kind === 'launch') beep(200, 0.12, 'sawtooth', 0.07);
  }

  function tickBgm(dt) {
    if (muted || !audioCtx || !started || gameOver) return;
    bgmTimer += dt;
    if (bgmTimer < 0.18) return;
    bgmTimer = 0;
    const melody = [392, 440, 523, 440, 349, 392, 330, 392];
    const bass = [98, 98, 130, 98, 87, 87, 110, 98];
    const i = bgmStep % melody.length;
    beep(melody[i], 0.12, 'square', 0.03);
    beep(bass[i], 0.16, 'triangle', 0.04);
    if (i % 2 === 0) beep(90, 0.04, 'sawtooth', 0.02);
    bgmStep++;
  }

  function resetBall() {
    ball.x = PX;
    ball.y = 470;
    ball.vx = 0;
    ball.vy = 0;
    ball.active = false;
    ball.captured = false;
    ball.trail.length = 0;
    launchCharge = 0;
    charging = false;
    hole.hold = 0;
    laneLock[0] = laneLock[1] = laneLock[2] = false;
  }

  function resetLights() {
    lanes.forEach((l) => { l.on = false; });
    targets.forEach((t) => { t.on = false; });
    laneLights.forEach((l) => { l.on = false; });
    upPost.up = false;
  }

  function resetGame() {
    balls = 3;
    ballsEl.textContent = pad(balls, 2);
    gameOver = false;
    setScore(0);
    resetLights();
    resetBall();
  }

  function loseBall() {
    balls -= 1;
    ballsEl.textContent = pad(Math.max(0, balls), 2);
    resetLights();
    if (balls <= 0) {
      gameOver = true;
      resetBall();
      beep(110, 0.4, 'square', 0.06);
      sfx('drain');
    } else {
      resetBall();
      beep(180, 0.2, 'triangle', 0.05);
    }
  }

  function launch() {
    if (gameOver) {
      resetGame();
      return;
    }
    if (ball.active) return;
    const p = Math.max(0.4, launchCharge || 0.7);
    ball.active = true;
    ball.vx = 0;
    ball.vy = -(520 + p * 420);
    launchCharge = 0;
    charging = false;
    beep(220 + p * 200, 0.12, 'square', 0.06);
    sfx('launch');
  }

  function closestPoint(ax, ay, bx, by, px, py) {
    const abx = bx - ax;
    const aby = by - ay;
    const apx = px - ax;
    const apy = py - ay;
    const d = abx * abx + aby * aby || 1;
    const t = Math.max(0, Math.min(1, (apx * abx + apy * aby) / d));
    return { x: ax + abx * t, y: ay + aby * t };
  }

  function collideSegment(ax, ay, bx, by, rest, boost) {
    const q = closestPoint(ax, ay, bx, by, ball.x, ball.y);
    let dx = ball.x - q.x;
    let dy = ball.y - q.y;
    let dist = Math.hypot(dx, dy);
    const thick = ball.r + 2.5;
    if (dist >= thick) return false;
    if (dist < 0.001) { dx = 0; dy = -1; dist = 1; }
    const nx = dx / dist;
    const ny = dy / dist;
    const pen = thick - dist;
    ball.x += nx * pen;
    ball.y += ny * pen;
    const vn = ball.vx * nx + ball.vy * ny;
    if (vn < 0) {
      ball.vx -= (1 + rest) * vn * nx;
      ball.vy -= (1 + rest) * vn * ny;
      if (boost) {
        ball.vx += nx * boost;
        ball.vy += ny * boost;
      }
      return 2;
    }
    return 1;
  }

  function collideCircle(c, extraBoost) {
    let dx = ball.x - c.x;
    let dy = ball.y - c.y;
    let d = Math.hypot(dx, dy);
    const min = ball.r + c.r;
    if (d >= min) return false;
    if (d < 0.001) { dx = 0; dy = -1; d = 1; }
    const nx = dx / d;
    const ny = dy / d;
    ball.x += nx * (min - d);
    ball.y += ny * (min - d);
    const vn = ball.vx * nx + ball.vy * ny;
    if (vn < 0) {
      ball.vx -= 1.85 * vn * nx;
      ball.vy -= 1.85 * vn * ny;
    }
    ball.vx += nx * extraBoost;
    ball.vy += ny * extraBoost;
    return true;
  }

  function collideRect(r, boost) {
    const nx0 = Math.max(r.x, Math.min(ball.x, r.x + r.w));
    const ny0 = Math.max(r.y, Math.min(ball.y, r.y + r.h));
    return collideCircle({ x: nx0, y: ny0, r: 0 }, boost || 0);
  }

  function updateFlipper(f, dt, side) {
    const target = f.pressed ? f.up : f.base;
    let diff = target - f.angle;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    const prev = f.angle;
    const speed = f.pressed ? 20 : 14;
    f.angle += diff * Math.min(1, speed * dt);
    f.omega = (f.angle - prev) / dt;
    const ex = f.px + Math.cos(f.angle) * f.len;
    const ey = f.py + Math.sin(f.angle) * f.len;
    const q = closestPoint(f.px, f.py, ex, ey, ball.x, ball.y);
    let dx = ball.x - q.x;
    let dy = ball.y - q.y;
    let d = Math.hypot(dx, dy);
    const thickness = 7;
    if (d >= ball.r + thickness) return;
    if (d < 0.001) { dx = 0; dy = -1; d = 1; }
    const nx = dx / d;
    const ny = dy / d;
    ball.x += nx * (ball.r + thickness - d);
    ball.y += ny * (ball.r + thickness - d);
    const rx = q.x - f.px;
    const ry = q.y - f.py;
    const surfVx = -f.omega * ry;
    const surfVy = f.omega * rx;
    const rvx = ball.vx - surfVx;
    const rvy = ball.vy - surfVy;
    const vn = rvx * nx + rvy * ny;
    if (vn < 0) {
      const impulse = -1.6 * vn;
      ball.vx += impulse * nx + surfVx * 0.3;
      ball.vy += impulse * ny + surfVy * 0.3;
      if (f.pressed) {
        ball.vx += side * 70;
        ball.vy -= 110;
      }
      sfx('flip');
    }
  }

  function maybeRaisePost() {
    const lanesOn = lanes.every((l) => l.on);
    const targetsOn = targets.every((t) => t.on);
    upPost.up = lanesOn || targetsOn;
  }

  function hitLane(i) {
    if (lanes[i].on) {
      addScore(lanes[i].value);
      return;
    }
    lanes[i].on = true;
    addScore(lanes[i].value);
    beep(660, 0.08, 'square', 0.05);
    maybeRaisePost();
    if (lanes.every((l) => l.on)) addScore(2000);
  }

  function spinSlot() {
    slot.spin = 0.9;
    slot.flash = 1;
    beep(400, 0.1, 'square', 0.05);
  }

  function finishSlot() {
    slot.reels = [0, 1, 2].map(() => Math.floor(Math.random() * 3));
    const a = slot.reels[0];
    const same = slot.reels.every((v) => v === a);
    const two = slot.reels[0] === slot.reels[1] || slot.reels[1] === slot.reels[2] || slot.reels[0] === slot.reels[2];
    if (same) {
      addScore(5000);
      upPost.up = true;
      beep(880, 0.25, 'square', 0.07);
    } else if (two) {
      addScore(1000);
      beep(660, 0.15, 'square', 0.05);
    } else {
      addScore(100);
    }
  }

  function physics(dt) {
    if (charging && !ball.active) launchCharge = Math.min(1, launchCharge + dt * 0.8);
    bumpers.forEach((b) => { b.flash = Math.max(0, b.flash - dt * 4); });
    slot.flash = Math.max(0, slot.flash - dt * 3);
    if (slot.spin > 0) {
      slot.spin -= dt;
      if (Math.random() < 0.4) slot.reels = [0, 1, 2].map(() => Math.floor(Math.random() * 3));
      if (slot.spin <= 0) finishSlot();
    }

    if (!ball.active || ball.captured) {
      if (ball.captured) {
        hole.hold -= dt;
        if (hole.hold <= 0) {
          ball.captured = false;
          ball.x = hole.x - 18;
          ball.y = hole.y - 8;
          ball.vx = -180;
          ball.vy = -320;
          addScore(500);
          beep(300, 0.12, 'triangle', 0.05);
        }
      }
      return;
    }

    ball.vy += gravity * dt;
    ball.vx *= 0.9995;
    ball.vy *= 0.9995;
    const maxSpeed = 1500;
    const sp = Math.hypot(ball.vx, ball.vy);
    if (sp > maxSpeed) {
      ball.vx *= maxSpeed / sp;
      ball.vy *= maxSpeed / sp;
    }
    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;

    for (const w of walls) {
      if (collideSegment(w[0], w[1], w[2], w[3], 0.86, 0) === 2) sfx('rail');
    }
    for (const s of slings) {
      if (collideSegment(s.a[0], s.a[1], s.b[0], s.b[1], 0.72, 0)) {
        ball.vx += s.kx;
        ball.vy += s.ky;
        addScore(10);
        sfx('sling');
      }
    }

    for (const p of lanePosts) {
      if (collideCircle(p, 80)) {
        addScore(10);
        sfx('post');
      }
    }

    for (const b of bumpers) {
      if (collideCircle(b, 190)) {
        b.flash = 1;
        addScore(b.value);
        sfx('bump');
        if (navigator.vibrate) navigator.vibrate(12);
      }
    }

    targets.forEach((t) => {
      if (collideRect(t, 40)) {
        if (!t.on) {
          t.on = true;
          addScore(200);
          sfx('target');
          maybeRaisePost();
          if (targets.every((x) => x.on)) addScore(1500);
        }
      }
    });

    laneLights.forEach((l) => {
      if (Math.hypot(ball.x - l.x, ball.y - l.y) < ball.r + 5) {
        if (!l.on) {
          l.on = true;
          addScore(50);
          if (laneLights.every((x) => x.on)) {
            addScore(1000);
            upPost.up = true;
          }
        }
      }
    });

    lanes.forEach((ln, i) => {
      const inside = ball.y > 28 && ball.y < 58 && ball.x > ln.x0 && ball.x < ln.x1;
      if (inside && ball.vy > 30 && !laneLock[i]) {
        laneLock[i] = true;
        hitLane(i);
      } else if (!inside) {
        laneLock[i] = false;
      }
    });

    if (collideRect(slot.target, 30)) {
      if (slot.spin <= 0) spinSlot();
    }

    if (!ball.captured && Math.hypot(ball.x - hole.x, ball.y - hole.y) < hole.r) {
      ball.captured = true;
      ball.vx = 0;
      ball.vy = 0;
      ball.x = hole.x;
      ball.y = hole.y;
      hole.hold = 0.7;
      sfx('hole');
    }

    if (upPost.up) collideCircle({ x: upPost.x, y: upPost.y, r: 8 }, 50);
    else collideCircle({ x: upPost.x, y: upPost.y, r: 4 }, 20);

    updateFlipper(flippers.left, dt, -1);
    updateFlipper(flippers.right, dt, 1);

    if (ball.x < TL - 8) { ball.x = TL + ball.r; ball.vx = Math.abs(ball.vx) * 0.4; }
    if (ball.x > PR + 6) { ball.x = PR - ball.r; ball.vx = -Math.abs(ball.vx) * 0.4; }

    if (ball.y > H + 24) loseBall();

    ball.trail.unshift({ x: ball.x | 0, y: ball.y | 0 });
    if (ball.trail.length > 8) ball.trail.pop();
  }

  function pxLine(ax, ay, bx, by, color, w) {
    ax |= 0; ay |= 0; bx |= 0; by |= 0;
    const dx = Math.abs(bx - ax);
    const dy = Math.abs(by - ay);
    const sx = ax < bx ? 1 : -1;
    const sy = ay < by ? 1 : -1;
    let err = dx - dy;
    let x = ax;
    let y = ay;
    const t = w || 3;
    ctx.fillStyle = color;
    while (true) {
      ctx.fillRect(x - (t >> 1), y - (t >> 1), t, t);
      if (x === bx && y === by) break;
      const e2 = 2 * err;
      if (e2 > -dy) { err -= dy; x += sx; }
      if (e2 < dx) { err += dx; y += sy; }
    }
  }

  function disk(x, y, r, color) {
    x |= 0; y |= 0; r |= 0;
    ctx.fillStyle = color;
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (dx * dx + dy * dy <= r * r) ctx.fillRect(x + dx, y + dy, 1, 1);
      }
    }
  }

  function rect(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x | 0, y | 0, w | 0, h | 0);
  }

  function drawReel(kind, cx, cy) {
    if (kind === 0) {
      disk(cx, cy, 6, C.cyan);
      disk(cx, cy, 3, '#183868');
    } else if (kind === 1) {
      rect(cx - 1, cy - 7, 3, 14, C.gold);
      rect(cx - 7, cy - 1, 14, 3, C.gold);
      rect(cx - 5, cy - 5, 3, 3, C.gold);
      rect(cx + 2, cy - 5, 3, 3, C.gold);
      rect(cx - 5, cy + 2, 3, 3, C.gold);
      rect(cx + 2, cy + 2, 3, 3, C.gold);
    } else {
      rect(cx - 6, cy, 12, 2, C.pink);
      rect(cx - 4, cy - 4, 8, 8, C.pink);
      rect(cx - 2, cy - 6, 4, 12, C.pink);
    }
  }

  function drawFlipper(f) {
    const ex = f.px + Math.cos(f.angle) * f.len;
    const ey = f.py + Math.sin(f.angle) * f.len;
    pxLine(f.px, f.py, ex, ey, C.cyan, 9);
    disk(f.px, f.py, 6, C.text);
  }

  function draw() {
    rect(0, 0, W, H, C.bg);

    rect(TL - 4, TT - 4, TR - TL + 10, 62, C.rail);
    rect(TL, TT, TR - TL + 2, 54, C.bg);

    pxLine(18, 28, 74, 28, lanes[0].on ? C.yellow : C.railHi, 2);
    pxLine(82, 28, 124, 28, lanes[1].on ? C.yellow : C.railHi, 2);
    pxLine(132, 28, 208, 28, lanes[2].on ? C.yellow : C.railHi, 2);

    ptext('500', 40, 20, C.cyan, 1);
    ptext('1000', 94, 20, C.gold, 1);
    ptext('500', 164, 20, C.cyan, 1);

    [[46, 58], [104, 58], [170, 58]].forEach((p) => {
      rect(p[0] - 3, p[1], 7, 4, C.cyan);
      rect(p[0] - 1, p[1] + 4, 3, 4, C.cyan);
    });

    lanePosts.forEach((p) => disk(p.x, p.y, p.r, C.pink));

    walls.forEach((w) => pxLine(w[0], w[1], w[2], w[3], C.rail, 7));
    walls.forEach((w) => pxLine(w[0], w[1], w[2], w[3], C.railHi, 2));
    slings.forEach((s) => pxLine(s.a[0], s.a[1], s.b[0], s.b[1], C.pink, 4));

    rect(198, 88, 18, 90, C.green);
    ptext('500', 197, 126, C.text, 1);

    laneLights.forEach((l) => disk(l.x, l.y, 3, l.on ? C.yellow : '#5a4800'));
    targets.forEach((t) => rect(t.x, t.y, t.w, t.h, t.on ? C.yellow : '#8a7000'));

    bumpers.forEach((b) => {
      disk(b.x, b.y, b.r + (b.flash ? 2 : 0), b.flash ? C.text : b.color);
      disk(b.x, b.y, Math.max(4, b.r - 7), C.bg);
      if (b.label) ptext(b.label, b.x - 8, b.y - 2, b.color, 1);
    });

    rect(slot.x, slot.y, slot.w, slot.h, '#183868');
    rect(slot.x, slot.y, slot.w, slot.h - 1, '#000');
    for (let i = 0; i < 3; i++) {
      const sx = slot.x + 6 + i * 36;
      rect(sx, slot.y + 4, 30, 20, slot.flash ? '#3c68b8' : '#204888');
      drawReel(slot.reels[i], sx + 15, slot.y + 14);
    }
    rect(slot.target.x, slot.target.y, slot.target.w, slot.target.h, C.pink);
    ptext('PINBALL', 90, 272, C.gold, 1);

    disk(hole.x, hole.y, hole.r, C.hole);
    disk(hole.x, hole.y, hole.r - 4, '#200800');
    disk(upPost.x, upPost.y, upPost.up ? 8 : 5, C.pink);

    drawFlipper(flippers.left);
    drawFlipper(flippers.right);

    const sy = 538;
    const total = 64 * (1 - launchCharge * 0.45);
    pxLine(PX - 4, sy, PX - 4, sy - total, '#b8f818', 2);
    pxLine(PX + 4, sy, PX + 4, sy - total, '#b8f818', 2);
    for (let i = 0; i < 8; i++) {
      const yy = sy - i * (total / 8);
      pxLine(PX - 5, yy, PX + 5, yy, '#b8f818', 1);
    }

    ball.trail.forEach((p, i) => {
      const a = 1 - i / ball.trail.length;
      disk(p.x, p.y, Math.max(1, (ball.r * a) | 0), '#88d8fc');
    });
    disk(ball.x, ball.y, ball.r, C.text);
    disk(ball.x - 2, ball.y - 2, 2, C.cyan);

    if (gameOver) {
      rect(28, 300, 160, 70, '#000');
      rect(28, 300, 160, 3, C.pink);
      rect(28, 367, 160, 3, C.pink);
      rect(28, 300, 3, 70, C.pink);
      rect(185, 300, 3, 70, C.pink);
      ptext('GAME OVER', 58, 322, C.text, 2);
      ptext('PULL TO RESTART', 48, 348, C.gold, 1);
    }
  }

  function loop(now) {
    const frame = Math.min(0.04, (now - last) / 1000);
    last = now;
    accumulator += frame;
    while (accumulator >= FIXED) {
      if (started) physics(FIXED);
      accumulator -= FIXED;
    }
    if (started) tickBgm(frame);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  function setFlip(side, on) {
    if (side === 'L') flippers.left.pressed = on;
    if (side === 'R') flippers.right.pressed = on;
    if (on && navigator.vibrate) navigator.vibrate(10);
  }

  addEventListener('keydown', (e) => {
    if (['ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
    if (!started) return;
    if (e.code === 'ArrowLeft' || e.code === 'KeyA' || e.code === 'KeyZ') setFlip('L', true);
    if (e.code === 'ArrowRight' || e.code === 'KeyD' || e.code === 'KeyX' || e.code === 'KeySlash') setFlip('R', true);
    if (e.code === 'Space') {
      if (!ball.active && !charging) charging = true;
      if (gameOver) launch();
    }
    if (e.code === 'KeyR') resetGame();
  }, { passive: false });

  addEventListener('keyup', (e) => {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA' || e.code === 'KeyZ') setFlip('L', false);
    if (e.code === 'ArrowRight' || e.code === 'KeyD' || e.code === 'KeyX' || e.code === 'KeySlash') setFlip('R', false);
    if (e.code === 'Space' && charging) launch();
  });

  function bindHold(el, onDown, onUp) {
    const down = (e) => {
      e.preventDefault();
      el.classList.add('is-pressed');
      unlockAudio();
      try { el.setPointerCapture(e.pointerId); } catch (_err) { /* ignore */ }
      if (navigator.vibrate) navigator.vibrate(12);
      onDown();
    };
    const up = (e) => {
      e.preventDefault();
      el.classList.remove('is-pressed');
      onUp();
    };
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
  }

  bindHold(document.getElementById('leftBtn'), () => setFlip('L', true), () => setFlip('L', false));
  bindHold(document.getElementById('rightBtn'), () => setFlip('R', true), () => setFlip('R', false));
  bindHold(document.getElementById('launchBtn'),
    () => { if (!ball.active) charging = true; },
    () => { if (charging) launch(); else if (gameOver) launch(); });

  const pointers = new Map();
  canvas.addEventListener('pointerdown', (e) => {
    if (!started) return;
    const r = canvas.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const side = x < 0.5 ? 'L' : 'R';
    pointers.set(e.pointerId, side);
    try { canvas.setPointerCapture(e.pointerId); } catch (_err) { /* ignore */ }
    setFlip(side, true);
  });
  function releasePtr(e) {
    const side = pointers.get(e.pointerId);
    pointers.delete(e.pointerId);
    if (side) {
      const still = [...pointers.values()].includes(side);
      if (!still) setFlip(side, false);
    }
  }
  canvas.addEventListener('pointerup', releasePtr);
  canvas.addEventListener('pointercancel', releasePtr);

  let lastTouchEnd = 0;
  document.addEventListener('touchend', (e) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) e.preventDefault();
    lastTouchEnd = now;
  }, { passive: false });
  document.addEventListener('touchstart', (e) => {
    const now = Date.now();
    if (now - lastTouchEnd < 300 && now - lastTouchEnd > 0) e.preventDefault();
  }, { passive: false });
  document.addEventListener('dblclick', (e) => e.preventDefault());
  document.addEventListener('contextmenu', (e) => e.preventDefault());
  document.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
  document.addEventListener('selectstart', (e) => e.preventDefault());
  document.addEventListener('dragstart', (e) => e.preventDefault());

  startEl.addEventListener('pointerdown', () => {
    unlockAudio();
    started = true;
    startEl.classList.add('hidden');
    resetGame();
    beep(523, 0.1, 'square', 0.05);
  });

  muteBtn.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    muted = !muted;
    muteBtn.textContent = muted ? '🔇' : '🔊';
    try { localStorage.setItem('pinball-mute', muted ? '1' : '0'); } catch (_err) { /* ignore */ }
  });
  try {
    muted = localStorage.getItem('pinball-mute') === '1';
    muteBtn.textContent = muted ? '🔇' : '🔊';
  } catch (_e) { /* ignore */ }

  document.addEventListener('visibilitychange', () => {
    if (!audioCtx) return;
    if (document.hidden) audioCtx.suspend();
    else if (!muted) audioCtx.resume();
  });

  topEl.textContent = pad(topScore, 6);
  ballsEl.textContent = pad(balls, 2);
  setScore(0);
})();
