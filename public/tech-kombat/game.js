const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const cabinet = document.getElementById("cabinet");
const mobileControls = document.getElementById("mobile-controls");
const controlButtons = [...document.querySelectorAll("[data-codes]")];

const WIDTH = 960;
const HEIGHT = 540;
const PANEL_HEIGHT = 134;
const ARENA_LEFT = 70;
const ARENA_RIGHT = WIDTH - 70;
const GROUND_Y = HEIGHT - PANEL_HEIGHT - 28;
const FIXED_DT = 1 / 60;
const ROUND_TIME = 60;

const MOVE_SPEED = 300;
const AIR_DRAG = 0.98;
const GROUND_FRICTION = 0.8;
const GRAVITY = 2200;
const JUMP_SPEED = 780;
const MAX_HEALTH = 100;
const MAX_SUPER = 100;
const COMBO_RESET_TIME = 1.05;

const ATTACKS = {
  punch: {
    duration: 0.22,
    activeStart: 0.075,
    activeEnd: 0.14,
    damage: 9,
    reach: 88,
    verticalRange: 96,
    cooldown: 0.23,
    push: 220,
    pop: 40,
    hitStun: 0.16,
    meterGain: 8,
    fx: "255,214,70",
  },
  kick: {
    duration: 0.32,
    activeStart: 0.1,
    activeEnd: 0.19,
    damage: 13,
    reach: 108,
    verticalRange: 108,
    cooldown: 0.31,
    push: 280,
    pop: 70,
    hitStun: 0.22,
    meterGain: 11,
    fx: "255,175,70",
  },
};

const roster = [
  {
    name: "ELON",
    accent: "#7bd7ff",
    suit: "#0f1730",
    skin: "#f2c39e",
    glow: "#31b2ff",
    cape: true,
    special: {
      id: "x-dash",
      name: "X DASH",
      duration: 0.56,
      activeWindows: [
        [0.1, 0.22],
      ],
      damage: 24,
      reach: 162,
      verticalRange: 124,
      cooldown: 0.8,
      push: 520,
      pop: 96,
      hitStun: 0.34,
      meterGain: 0,
      fx: "123,215,255",
      cost: 40,
      moveStyle: "dash",
    },
  },
  {
    name: "ZUCK",
    accent: "#ff7d5e",
    suit: "#2b1325",
    skin: "#edc1a3",
    glow: "#ff9f3a",
    hoodie: true,
    special: {
      id: "meta-shield",
      name: "META SHIELD",
      duration: 0.52,
      activeWindows: [
        [0.16, 0.28],
      ],
      damage: 20,
      reach: 116,
      verticalRange: 126,
      cooldown: 0.8,
      push: 320,
      pop: 70,
      hitStun: 0.26,
      meterGain: 0,
      fx: "255,126,94",
      cost: 40,
      hitMode: "radius",
    },
  },
  {
    name: "GATES",
    accent: "#9de067",
    suit: "#23301a",
    skin: "#f1cfaa",
    glow: "#97ff5b",
    glasses: true,
    special: {
      id: "blue-screen",
      name: "BLUE SCREEN",
      duration: 0.58,
      activeWindows: [
        [0.18, 0.34],
      ],
      damage: 23,
      reach: 208,
      verticalRange: 104,
      cooldown: 0.84,
      push: 360,
      pop: 84,
      hitStun: 0.33,
      meterGain: 0,
      fx: "157,224,103",
      cost: 40,
      hitMode: "beam",
    },
  },
  {
    name: "BEZOS",
    accent: "#ffe575",
    suit: "#33290f",
    skin: "#f4cda4",
    glow: "#ffcb45",
    bald: true,
    special: {
      id: "prime-drop",
      name: "PRIME DROP",
      duration: 0.68,
      activeWindows: [
        [0.28, 0.36],
      ],
      damage: 26,
      reach: 86,
      verticalRange: 188,
      cooldown: 0.92,
      push: 260,
      pop: 140,
      hitStun: 0.38,
      meterGain: 0,
      fx: "255,219,95",
      cost: 40,
      hitMode: "drop",
      zoneWidth: 78,
    },
  },
  {
    name: "DOGE",
    accent: "#f7cd75",
    suit: "#3a2712",
    skin: "#f7dbb0",
    glow: "#fdbb3b",
    animal: true,
    special: {
      id: "moon-bark",
      name: "MOON BARK",
      duration: 0.62,
      activeWindows: [
        [0.1, 0.16],
        [0.24, 0.32],
      ],
      damage: 12,
      reach: 124,
      verticalRange: 116,
      cooldown: 0.78,
      push: 250,
      pop: 58,
      hitStun: 0.2,
      meterGain: 0,
      fx: "247,205,117",
      cost: 40,
      moveStyle: "rush",
    },
  },
  {
    name: "ALTMAN",
    accent: "#9de7ff",
    suit: "#14293a",
    skin: "#eac4a3",
    glow: "#64d0ff",
    tie: true,
    special: {
      id: "prompt-storm",
      name: "PROMPT STORM",
      duration: 0.56,
      activeWindows: [
        [0.16, 0.3],
      ],
      damage: 24,
      reach: 184,
      verticalRange: 130,
      cooldown: 0.82,
      push: 410,
      pop: 92,
      hitStun: 0.35,
      meterGain: 0,
      fx: "157,231,255",
      cost: 40,
      hitMode: "storm",
    },
  },
];

const state = {
  mode: "menu",
  round: 1,
  timer: ROUND_TIME,
  countdown: 0,
  roundOverTimer: 0,
  roundMessage: "FIGHT!",
  playerScore: 0,
  enemyScore: 0,
  playerIndex: 0,
  enemyIndex: 1,
  aiMoveX: 0,
  aiDecisionTimer: 0,
  aiSuperBias: 0,
  hitFlash: 0,
  cameraShake: 0,
  showFightBanner: 0,
  announcerText: "",
  announcerTimer: 0,
  firstHitCalled: false,
  frame: 0,
  player: null,
  enemy: null,
};

const keysDown = new Set();
const keysPressed = new Set();
let pointer = { x: 0, y: 0 };
let accumulator = 0;
let lastTs = performance.now();
let manualStepping = false;
const activeControlPointers = new Map();
const audioState = {
  ctx: null,
  unlocked: false,
  noiseBuffer: null,
};

function getSpecial(fighterOrIndex) {
  const rosterIndex = typeof fighterOrIndex === "number" ? fighterOrIndex : fighterOrIndex.rosterIndex;
  return roster[rosterIndex].special;
}

function getAttackProfile(fighter, attack) {
  return attack.type === "special" ? getSpecial(fighter) : ATTACKS[attack.type];
}

function getAttackWindows(move) {
  return move.activeWindows || [[move.activeStart, move.activeEnd]];
}

function getControlCodes(value) {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function getActiveWindowIndex(move, time) {
  const windows = getAttackWindows(move);
  for (let i = 0; i < windows.length; i++) {
    const [start, end] = windows[i];
    if (time >= start && time <= end) return i;
  }
  return -1;
}

function ensureAudioContext() {
  if (audioState.ctx) return audioState.ctx;
  const AudioCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtor) return null;
  try {
    audioState.ctx = new AudioCtor();
  } catch {
    audioState.ctx = null;
  }
  return audioState.ctx;
}

async function unlockAudio() {
  const ctx = ensureAudioContext();
  if (!ctx) return;
  try {
    if (ctx.state === "suspended") await ctx.resume();
    audioState.unlocked = ctx.state === "running";
  } catch {
    audioState.unlocked = false;
  }
}

function pressInputCodes(codes) {
  for (const code of codes) {
    if (!keysDown.has(code)) keysPressed.add(code);
    keysDown.add(code);
    if (code === "KeyF") toggleFullscreen().catch(() => {});
  }
}

function releaseInputCodes(codes) {
  for (const code of codes) {
    keysDown.delete(code);
  }
}

function clearActiveControl(pointerId) {
  const active = activeControlPointers.get(pointerId);
  if (!active) return;
  releaseInputCodes(active.codes);
  active.button.classList.remove("is-active");
  activeControlPointers.delete(pointerId);
}

function clearAllActiveControls() {
  for (const pointerId of activeControlPointers.keys()) {
    clearActiveControl(pointerId);
  }
}

function ensureNoiseBuffer(ctx) {
  if (audioState.noiseBuffer) return audioState.noiseBuffer;
  const length = Math.floor(ctx.sampleRate * 0.25);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  audioState.noiseBuffer = buffer;
  return buffer;
}

function scheduleTone(ctx, options) {
  const {
    when = ctx.currentTime,
    duration = 0.12,
    gain = 0.05,
    type = "square",
    startFreq = 220,
    endFreq = startFreq,
  } = options;
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(startFreq, when);
  osc.frequency.exponentialRampToValueAtTime(Math.max(40, endFreq), when + duration);
  amp.gain.setValueAtTime(0.0001, when);
  amp.gain.exponentialRampToValueAtTime(gain, when + 0.01);
  amp.gain.exponentialRampToValueAtTime(0.0001, when + duration);
  osc.connect(amp);
  amp.connect(ctx.destination);
  osc.start(when);
  osc.stop(when + duration + 0.02);
}

function scheduleNoise(ctx, options) {
  const { when = ctx.currentTime, duration = 0.08, gain = 0.03, filterFreq = 1200 } = options;
  const src = ctx.createBufferSource();
  const filter = ctx.createBiquadFilter();
  const amp = ctx.createGain();
  src.buffer = ensureNoiseBuffer(ctx);
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(filterFreq, when);
  amp.gain.setValueAtTime(0.0001, when);
  amp.gain.exponentialRampToValueAtTime(gain, when + 0.01);
  amp.gain.exponentialRampToValueAtTime(0.0001, when + duration);
  src.connect(filter);
  filter.connect(amp);
  amp.connect(ctx.destination);
  src.start(when);
  src.stop(when + duration + 0.02);
}

function playSfx(kind, detail = {}) {
  const ctx = ensureAudioContext();
  if (!ctx || !audioState.unlocked) return;
  const now = ctx.currentTime;

  if (kind === "menuMove") {
    scheduleTone(ctx, { when: now, startFreq: 540, endFreq: 680, duration: 0.06, gain: 0.03 });
    return;
  }
  if (kind === "confirm") {
    scheduleTone(ctx, { when: now, startFreq: 360, endFreq: 520, duration: 0.09, gain: 0.045 });
    scheduleTone(ctx, { when: now + 0.05, startFreq: 520, endFreq: 760, duration: 0.09, gain: 0.035 });
    return;
  }
  if (kind === "punch") {
    scheduleTone(ctx, { when: now, startFreq: 190, endFreq: 110, duration: 0.08, gain: 0.05 });
    scheduleNoise(ctx, { when: now, duration: 0.05, gain: 0.015, filterFreq: 1500 });
    return;
  }
  if (kind === "kick") {
    scheduleTone(ctx, { when: now, startFreq: 120, endFreq: 70, duration: 0.11, gain: 0.055, type: "sawtooth" });
    scheduleNoise(ctx, { when: now + 0.01, duration: 0.07, gain: 0.018, filterFreq: 900 });
    return;
  }
  if (kind === "block") {
    scheduleTone(ctx, { when: now, startFreq: 840, endFreq: 420, duration: 0.08, gain: 0.032, type: "triangle" });
    return;
  }
  if (kind === "fight") {
    scheduleTone(ctx, { when: now, startFreq: 220, endFreq: 300, duration: 0.12, gain: 0.045, type: "sawtooth" });
    scheduleTone(ctx, { when: now + 0.08, startFreq: 300, endFreq: 420, duration: 0.14, gain: 0.04, type: "sawtooth" });
    return;
  }
  if (kind === "ko") {
    scheduleTone(ctx, { when: now, startFreq: 180, endFreq: 60, duration: 0.28, gain: 0.07, type: "sawtooth" });
    scheduleNoise(ctx, { when: now + 0.04, duration: 0.18, gain: 0.016, filterFreq: 520 });
    return;
  }
  if (kind === "win") {
    scheduleTone(ctx, { when: now, startFreq: 260, endFreq: 390, duration: 0.1, gain: 0.04, type: "triangle" });
    scheduleTone(ctx, { when: now + 0.1, startFreq: 390, endFreq: 620, duration: 0.16, gain: 0.035, type: "triangle" });
    return;
  }
  if (kind === "specialStart") {
    const map = {
      "x-dash": [220, 440],
      "meta-shield": [180, 280],
      "blue-screen": [140, 180],
      "prime-drop": [110, 160],
      "moon-bark": [240, 200],
      "prompt-storm": [260, 520],
    };
    const [startFreq, endFreq] = map[detail.specialId] || [220, 360];
    scheduleTone(ctx, { when: now, startFreq, endFreq, duration: 0.18, gain: 0.05, type: "sawtooth" });
    scheduleTone(ctx, { when: now + 0.04, startFreq: endFreq, endFreq: endFreq * 1.2, duration: 0.12, gain: 0.028, type: "triangle" });
    return;
  }
  if (kind === "specialHit") {
    scheduleTone(ctx, { when: now, startFreq: 90, endFreq: 40, duration: 0.2, gain: 0.08, type: "sawtooth" });
    scheduleNoise(ctx, { when: now, duration: 0.12, gain: 0.024, filterFreq: 720 });
  }
}

function speakAnnouncer(text, duration = 1.25) {
  state.announcerText = text.toUpperCase();
  state.announcerTimer = duration;

  const ctx = ensureAudioContext();
  if (ctx && audioState.unlocked) {
    const base = 150 + text.length * 6;
    scheduleTone(ctx, { when: ctx.currentTime, startFreq: base, endFreq: base * 0.92, duration: 0.18, gain: 0.045, type: "triangle" });
    scheduleTone(ctx, { when: ctx.currentTime + 0.12, startFreq: base * 1.18, endFreq: base * 1.05, duration: 0.22, gain: 0.04, type: "triangle" });
  }

  if (!("speechSynthesis" in window)) return;
  try {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.85;
    utterance.pitch = 0.65;
    utterance.volume = 0.8;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  } catch {
    // Ignore speech synthesis failures and keep the text/synth fallback.
  }
}

function makeFighter(side, rosterIndex) {
  return {
    side,
    rosterIndex,
    x: side === "left" ? 240 : WIDTH - 240,
    y: GROUND_Y,
    vx: 0,
    vy: 0,
    w: 56,
    h: 118,
    facing: side === "left" ? 1 : -1,
    hp: MAX_HEALTH,
    superMeter: 45,
    comboCount: 0,
    comboTimer: 0,
    attack: null,
    attackCooldown: 0,
    hitStun: 0,
    block: false,
    hurtFlash: 0,
    grounded: true,
  };
}

function pickEnemyIndex(preferred) {
  if (typeof preferred === "number" && preferred !== state.playerIndex) return preferred;
  let idx = Math.floor(Math.random() * roster.length);
  if (idx === state.playerIndex) idx = (idx + 1) % roster.length;
  return idx;
}

function startRound() {
  state.player = makeFighter("left", state.playerIndex);
  state.enemy = makeFighter("right", state.enemyIndex);
  state.timer = ROUND_TIME;
  state.countdown = 2.1;
  state.roundMessage = "FIGHT!";
  state.showFightBanner = 0.6;
  state.aiMoveX = 0;
  state.aiSuperBias = Math.random();
  state.aiDecisionTimer = 0;
  state.announcerText = "";
  state.announcerTimer = 0;
  state.firstHitCalled = false;
  state.mode = "countdown";
}

function startMatch() {
  state.round = 1;
  state.playerScore = 0;
  state.enemyScore = 0;
  state.enemyIndex = pickEnemyIndex(state.enemyIndex);
  playSfx("confirm");
  startRound();
}

function backToMenu() {
  state.mode = "menu";
  state.roundMessage = "PRESS ENTER";
  state.announcerText = "";
  state.announcerTimer = 0;
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function isOnGround(f) {
  return Math.abs(f.y - GROUND_Y) < 0.6;
}

function gainMeter(fighter, amount) {
  fighter.superMeter = clamp(fighter.superMeter + amount, 0, MAX_SUPER);
}

function canUseSpecial(fighter) {
  return fighter.superMeter >= getSpecial(fighter).cost;
}

function updateComboState(fighter, dt) {
  fighter.comboTimer = Math.max(0, fighter.comboTimer - dt);
  if (fighter.comboTimer === 0) fighter.comboCount = 0;
}

function applyPhysics(f, inputX, jumpRequested, dt) {
  if (f.hitStun > 0) inputX = 0;

  const target = inputX * MOVE_SPEED;
  if (Math.abs(inputX) > 0.01) {
    f.vx += (target - f.vx) * 0.25;
  } else {
    f.vx *= isOnGround(f) ? GROUND_FRICTION : AIR_DRAG;
  }

  if (jumpRequested && isOnGround(f) && f.hitStun <= 0) {
    f.vy = -JUMP_SPEED;
    f.grounded = false;
  }

  f.vy += GRAVITY * dt;
  f.x += f.vx * dt;
  f.y += f.vy * dt;

  if (f.y >= GROUND_Y) {
    f.y = GROUND_Y;
    f.vy = 0;
    f.grounded = true;
  } else {
    f.grounded = false;
  }

  f.x = clamp(f.x, ARENA_LEFT + f.w * 0.5, ARENA_RIGHT - f.w * 0.5);
}

function attackConnects(attacker, defender, move, attack) {
  const dx = defender.x - attacker.x;
  const projected = dx * attacker.facing;
  const yGap = Math.abs(defender.y - attacker.y);

  if (move.hitMode === "radius") {
    return Math.abs(dx) <= move.reach && yGap <= move.verticalRange;
  }
  if (move.hitMode === "drop") {
    return (
      Math.abs(defender.x - (attack.targetX ?? attacker.x)) <= move.zoneWidth &&
      yGap <= move.verticalRange
    );
  }
  return projected >= 16 && projected <= move.reach && yGap <= move.verticalRange;
}

function applySpecialMotion(attacker, move, attack) {
  if (move.id === "x-dash" && attack.time < 0.24) {
    attacker.vx = attacker.facing * 520;
  }
  if (move.id === "meta-shield" && attack.time < 0.28) {
    attacker.block = true;
    attacker.vx *= 0.8;
  }
  if (move.id === "moon-bark" && attack.time < 0.36) {
    attacker.vx = attacker.facing * 340;
  }
}

function startAttack(attacker, defender, type) {
  if (state.mode !== "fight") return;
  if (attacker.hitStun > 0 || attacker.attack || attacker.attackCooldown > 0) return;
  if (type !== "special" && !ATTACKS[type]) return;

  if (type === "special") {
    const special = getSpecial(attacker);
    if (attacker.superMeter < special.cost) return;
    attacker.superMeter -= special.cost;
    attacker.comboCount = 0;
    attacker.comboTimer = 0;
    attacker.attack = {
      type,
      time: 0,
      windowHits: {},
      hits: 0,
      targetX:
        special.hitMode === "drop" && defender
          ? clamp(defender.x, ARENA_LEFT + 80, ARENA_RIGHT - 80)
          : null,
    };
    attacker.attackCooldown = special.cooldown;
    state.announcerText = special.name;
    state.announcerTimer = 0.95;
    playSfx("specialStart", { specialId: special.id });
    return;
  }

  attacker.attack = { type, time: 0, windowHits: {}, hits: 0 };
  attacker.attackCooldown = ATTACKS[type].cooldown;
}

function canBlock(defender, attacker) {
  if (!defender.block || defender.hitStun > 0) return false;
  return defender.facing === -attacker.facing;
}

function tryHit(attacker, defender) {
  if (!attacker.attack) return;
  const move = getAttackProfile(attacker, attacker.attack);
  const activeWindowIndex = getActiveWindowIndex(move, attacker.attack.time);
  if (activeWindowIndex === -1) return;
  if (attacker.attack.windowHits[activeWindowIndex]) return;
  if (!attackConnects(attacker, defender, move, attacker.attack)) return;

  const blocked = canBlock(defender, attacker);
  const comboBonus = blocked ? 0 : Math.min(6, Math.max(0, attacker.comboCount - 1) * 1.25);
  const damage = blocked ? move.damage * 0.28 : move.damage + comboBonus;
  defender.hp = clamp(defender.hp - damage, 0, MAX_HEALTH);
  defender.hitStun = blocked ? 0.08 : move.hitStun;
  defender.vx += attacker.facing * move.push * (blocked ? 0.35 : 1);
  defender.vy -= move.pop * (blocked ? 0.2 : 1);
  defender.hurtFlash = blocked ? 0.04 : 0.12;
  state.cameraShake = blocked ? 2 : attacker.attack.type === "special" ? 9 : 5;
  state.hitFlash = blocked ? 0.04 : attacker.attack.type === "special" ? 0.14 : 0.08;

  if (blocked) {
    gainMeter(attacker, 2);
    gainMeter(defender, 3);
    attacker.comboCount = 0;
    attacker.comboTimer = 0;
    playSfx("block");
  } else {
    if (attacker.comboTimer > 0) {
      attacker.comboCount += 1;
    } else {
      attacker.comboCount = 1;
    }
    attacker.comboTimer = COMBO_RESET_TIME;
    gainMeter(attacker, move.meterGain + attacker.comboCount * 1.2);
    gainMeter(defender, attacker.attack.type === "special" ? 7 : 4);
    if (!state.firstHitCalled) {
      state.firstHitCalled = true;
      speakAnnouncer("First hit", 1.1);
    }
    if (attacker.attack.type === "special") {
      playSfx("specialHit");
    } else {
      playSfx(attacker.attack.type);
    }
  }

  attacker.attack.windowHits[activeWindowIndex] = true;
  attacker.attack.hits += 1;
}

function updateAttack(attacker, defender, dt) {
  attacker.attackCooldown = Math.max(0, attacker.attackCooldown - dt);
  attacker.hitStun = Math.max(0, attacker.hitStun - dt);
  attacker.hurtFlash = Math.max(0, attacker.hurtFlash - dt);
  updateComboState(attacker, dt);
  if (!attacker.attack) return;

  const move = getAttackProfile(attacker, attacker.attack);
  attacker.attack.time += dt;
  if (attacker.attack.type === "special") applySpecialMotion(attacker, move, attacker.attack);

  if (getActiveWindowIndex(move, attacker.attack.time) !== -1) {
    tryHit(attacker, defender);
  }

  if (attacker.attack.time >= move.duration) {
    attacker.attack = null;
  }
}

function separateFighters() {
  const dx = state.enemy.x - state.player.x;
  const minGap = 64;
  if (Math.abs(dx) >= minGap) return;
  const sign = dx >= 0 ? 1 : -1;
  const overlap = minGap - Math.abs(dx);
  state.player.x -= sign * overlap * 0.5;
  state.enemy.x += sign * overlap * 0.5;
  state.player.x = clamp(state.player.x, ARENA_LEFT + 20, ARENA_RIGHT - 20);
  state.enemy.x = clamp(state.enemy.x, ARENA_LEFT + 20, ARENA_RIGHT - 20);
}

function updateFacing() {
  state.player.facing = state.player.x <= state.enemy.x ? 1 : -1;
  state.enemy.facing = -state.player.facing;
}

function updateAI(dt) {
  const ai = state.enemy;
  const human = state.player;

  if (ai.hitStun > 0) {
    state.aiMoveX = 0;
    return;
  }

  state.aiDecisionTimer -= dt;
  if (state.aiDecisionTimer <= 0) {
    const dx = human.x - ai.x;
    const adx = Math.abs(dx);
    state.aiDecisionTimer = 0.08 + Math.random() * 0.15;

    if (adx > 140) {
      state.aiMoveX = Math.sign(dx);
    } else if (adx < 72) {
      state.aiMoveX = Math.random() < 0.45 ? -Math.sign(dx) : 0;
    } else {
      state.aiMoveX = Math.random() < 0.2 ? 0 : Math.sign(dx);
    }

    if (ai.attackCooldown <= 0 && !ai.attack && adx < 210) {
      if (canUseSpecial(ai) && adx < 182) {
        if (Math.random() < 0.13 + state.aiSuperBias * 0.18) {
          startAttack(ai, human, "special");
        } else if (adx < 112 && Math.random() < 0.68) {
          startAttack(ai, human, Math.random() < 0.63 ? "punch" : "kick");
        }
      } else if (adx < 112 && Math.random() < 0.68) {
        startAttack(ai, human, Math.random() < 0.63 ? "punch" : "kick");
      }
    }

    if (isOnGround(ai) && adx > 120 && Math.random() < 0.06) {
      ai.vy = -JUMP_SPEED * 0.92;
    }
  }

  ai.block = ai.attackCooldown > 0 && Math.abs(state.player.x - ai.x) < 94 && Math.random() < 0.22;
}

function updateFight(dt) {
  const player = state.player;
  const enemy = state.enemy;

  if (!player || !enemy) return;

  const moveX = (keysDown.has("ArrowRight") ? 1 : 0) - (keysDown.has("ArrowLeft") ? 1 : 0);
  const jump = keysPressed.has("ArrowUp");

  player.block = keysDown.has("KeyB");
  applyPhysics(player, moveX, jump, dt);

  updateAI(dt);
  applyPhysics(enemy, state.aiMoveX, false, dt);

  updateFacing();

  const superInput = keysPressed.has("Space") && keysPressed.has("KeyA");
  if (superInput) {
    if (canUseSpecial(player)) startAttack(player, enemy, "special");
    else startAttack(player, enemy, "kick");
  } else {
    if (keysPressed.has("Space")) startAttack(player, enemy, "punch");
    if (keysPressed.has("KeyA")) startAttack(player, enemy, "kick");
  }

  updateAttack(player, enemy, dt);
  updateAttack(enemy, player, dt);

  gainMeter(player, dt * 2.2);
  gainMeter(enemy, dt * 2.1);

  separateFighters();
  state.cameraShake = Math.max(0, state.cameraShake - dt * 20);
  state.hitFlash = Math.max(0, state.hitFlash - dt);

  state.timer = Math.max(0, state.timer - dt);

  const ko = player.hp <= 0 || enemy.hp <= 0;
  const timeout = state.timer <= 0;
  if (!ko && !timeout) return;

  if (player.hp === enemy.hp) {
    state.roundMessage = "DRAW ROUND";
    speakAnnouncer("Time", 1.1);
  } else if (player.hp > enemy.hp) {
    state.playerScore += 1;
    state.roundMessage = "PLAYER WINS";
    if (ko) {
      playSfx("ko");
      speakAnnouncer("Knockout", 1.75);
    }
  } else {
    state.enemyScore += 1;
    state.roundMessage = "CPU WINS";
    if (ko) {
      playSfx("ko");
      speakAnnouncer("Knockout", 1.75);
    }
  }

  state.mode = "round_over";
  state.roundOverTimer = 2.3;
}

function updateRoundOver(dt) {
  state.roundOverTimer -= dt;
  if (state.roundOverTimer > 0) return;

  if (state.playerScore >= 2 || state.enemyScore >= 2) {
    state.mode = "match_over";
    state.roundMessage = state.playerScore > state.enemyScore ? "PLAYER VICTORY" : "CPU VICTORY";
    playSfx("win");
    speakAnnouncer(state.playerScore > state.enemyScore ? "Player wins" : "Cpu wins", 1.35);
    return;
  }

  state.round += 1;
  state.enemyIndex = pickEnemyIndex(state.enemyIndex);
  startRound();
}

function updateCountdown(dt) {
  state.countdown -= dt;
  if (state.countdown <= 0) {
    state.mode = "fight";
    state.countdown = 0;
    state.roundMessage = "";
    playSfx("fight");
    speakAnnouncer("Fight", 1);
  }
  state.showFightBanner = Math.max(0, state.showFightBanner - dt);
}

function handleMenuInput() {
  if (keysPressed.has("ArrowLeft")) {
    state.playerIndex = (state.playerIndex - 1 + roster.length) % roster.length;
    if (state.enemyIndex === state.playerIndex) state.enemyIndex = pickEnemyIndex();
    playSfx("menuMove");
  }
  if (keysPressed.has("ArrowRight")) {
    state.playerIndex = (state.playerIndex + 1) % roster.length;
    if (state.enemyIndex === state.playerIndex) state.enemyIndex = pickEnemyIndex();
    playSfx("menuMove");
  }
  if (keysPressed.has("Enter")) {
    startMatch();
  }
}

function step(dt) {
  if (keysPressed.has("Enter")) {
    if (state.mode === "match_over") backToMenu();
  }

  if (state.mode === "menu") {
    handleMenuInput();
  } else if (state.mode === "countdown") {
    updateCountdown(dt);
  } else if (state.mode === "fight") {
    updateFight(dt);
  } else if (state.mode === "round_over") {
    updateRoundOver(dt);
  } else if (state.mode === "match_over") {
    if (keysPressed.has("Enter")) backToMenu();
  }

  state.announcerTimer = Math.max(0, state.announcerTimer - dt);
  if (state.announcerTimer === 0) state.announcerText = "";
  keysPressed.clear();
  state.frame += 1;
}

function drawGridBackground() {
  const sky = ctx.createLinearGradient(0, 0, 0, HEIGHT - PANEL_HEIGHT);
  sky.addColorStop(0, "#081c4a");
  sky.addColorStop(0.56, "#0a2f69");
  sky.addColorStop(1, "#02122c");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, WIDTH, HEIGHT - PANEL_HEIGHT);

  ctx.strokeStyle = "#2f89d0";
  ctx.lineWidth = 3;
  ctx.strokeRect(38, 34, WIDTH - 76, HEIGHT - PANEL_HEIGHT - 54);
  ctx.strokeRect(62, 58, WIDTH - 124, HEIGHT - PANEL_HEIGHT - 102);

  ctx.strokeStyle = "rgba(86, 190, 255, 0.26)";
  ctx.lineWidth = 2;
  for (let i = 0; i < 11; i++) {
    const x = 80 + i * 78;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x - 40, HEIGHT - PANEL_HEIGHT - 28);
    ctx.stroke();
  }

  const floorY = GROUND_Y + 18;
  const floor = ctx.createLinearGradient(0, GROUND_Y - 30, 0, floorY + 30);
  floor.addColorStop(0, "#16467f");
  floor.addColorStop(1, "#081d42");
  ctx.fillStyle = floor;
  ctx.fillRect(20, GROUND_Y - 36, WIDTH - 40, 64);

  ctx.strokeStyle = "rgba(116, 255, 220, 0.33)";
  ctx.lineWidth = 2;
  for (let i = 0; i < 17; i++) {
    const x = 20 + i * 56;
    ctx.beginPath();
    ctx.moveTo(x, floorY + 8);
    ctx.lineTo(x + 12, GROUND_Y - 26);
    ctx.stroke();
  }

  ctx.fillStyle = "#50b8ff";
  ctx.font = "bold 22px 'Courier New', monospace";
  ctx.textAlign = "center";
  ctx.fillText("GIGAFACTORY ARENA", WIDTH * 0.5, 106);

  if (state.mode === "countdown" || state.showFightBanner > 0.01) {
    const alpha = clamp(state.showFightBanner * 1.4, 0, 1);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "#ffcc36";
    ctx.strokeStyle = "#1e2137";
    ctx.lineWidth = 5;
    ctx.font = "bold 72px 'Courier New', monospace";
    ctx.textAlign = "center";
    ctx.strokeText("FIGHT!", WIDTH * 0.5, 174);
    ctx.fillText("FIGHT!", WIDTH * 0.5, 174);
    ctx.globalAlpha = 1;
  }
}

function drawHealthBar(label, hp, x, y, w, alignRight = false) {
  const hpRatio = hp / MAX_HEALTH;
  ctx.fillStyle = "#151515";
  ctx.fillRect(x, y, w, 24);
  ctx.strokeStyle = "#f0f0f0";
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, 24);

  const fillW = Math.max(0, Math.floor((w - 4) * hpRatio));
  const fillX = alignRight ? x + w - 2 - fillW : x + 2;
  ctx.fillStyle = hpRatio > 0.25 ? "#ffdf2e" : "#ff4f4f";
  ctx.fillRect(fillX, y + 2, fillW, 20);

  ctx.font = "bold 22px 'Courier New', monospace";
  ctx.fillStyle = "#f2f4fb";
  ctx.textAlign = alignRight ? "right" : "left";
  ctx.fillText(label, alignRight ? x + w : x, y + 48);
}

function drawSuperBar(meter, x, y, w, alignRight = false) {
  const ratio = clamp(meter / MAX_SUPER, 0, 1);
  ctx.fillStyle = "#09122f";
  ctx.fillRect(x, y, w, 12);
  ctx.strokeStyle = "#60b8ef";
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, 12);

  const fillW = Math.max(0, Math.floor((w - 4) * ratio));
  const fillX = alignRight ? x + w - 2 - fillW : x + 2;
  const grad = ctx.createLinearGradient(fillX, y, fillX + Math.max(fillW, 1), y + 10);
  grad.addColorStop(0, "#2ad3ff");
  grad.addColorStop(1, ratio >= 0.98 ? "#d8ff6a" : "#4b9dff");
  ctx.fillStyle = grad;
  ctx.fillRect(fillX, y + 2, fillW, 8);
}

function drawRoundPips(score, x, y, alignRight = false) {
  for (let i = 0; i < 2; i++) {
    const px = alignRight ? x - i * 18 : x + i * 18;
    ctx.fillStyle = i < score ? "#ffcc3b" : "#33435d";
    ctx.beginPath();
    ctx.arc(px, y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#101726";
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

function getBodyY(fighter) {
  return fighter.y - fighter.h + Math.sin((state.frame + fighter.x * 0.2) * 0.08) * 1.6;
}

function drawAttackEffect(fighter) {
  if (!fighter || !fighter.attack) return;
  const move = getAttackProfile(fighter, fighter.attack);
  const x = fighter.x;
  const y = fighter.y;
  const bodyY = getBodyY(fighter);
  const progress = clamp(fighter.attack.time / move.duration, 0, 1);

  if (fighter.attack.type !== "special") {
    ctx.fillStyle = `rgba(${move.fx}, 0.5)`;
    const fx = x + fighter.facing * (fighter.attack.type === "kick" ? 60 : 48);
    ctx.beginPath();
    ctx.arc(fx, bodyY + 36, fighter.attack.type === "kick" ? 14 : 10, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  if (move.id === "x-dash") {
    for (let i = 0; i < 4; i++) {
      const trailX = x - fighter.facing * (28 + i * 24 + progress * 26);
      ctx.fillStyle = `rgba(${move.fx}, ${0.24 - i * 0.04})`;
      ctx.fillRect(trailX - 20, bodyY + 8, 36, 64);
    }
    ctx.strokeStyle = `rgba(${move.fx}, 0.85)`;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x + fighter.facing * 10, bodyY + 30);
    ctx.lineTo(x + fighter.facing * 88, bodyY + 10);
    ctx.lineTo(x + fighter.facing * 116, bodyY + 28);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + fighter.facing * 20, bodyY + 48);
    ctx.lineTo(x + fighter.facing * 96, bodyY + 22);
    ctx.lineTo(x + fighter.facing * 120, bodyY + 44);
    ctx.stroke();
    return;
  }

  if (move.id === "meta-shield") {
    const radius = 26 + progress * 34;
    ctx.strokeStyle = `rgba(${move.fx}, 0.7)`;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(x, bodyY + 28, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, bodyY + 28, radius * 0.6, 0, Math.PI * 2);
    ctx.stroke();
    return;
  }

  if (move.id === "blue-screen") {
    const startX = x + fighter.facing * 22;
    const endX = x + fighter.facing * (move.reach - 10);
    ctx.strokeStyle = `rgba(${move.fx}, 0.85)`;
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.moveTo(startX, bodyY + 28);
    ctx.lineTo(endX, bodyY + 28);
    ctx.stroke();
    ctx.fillStyle = "rgba(14, 22, 45, 0.45)";
    for (let i = 0; i < 4; i++) {
      const glitchX = startX + fighter.facing * (30 + i * 36);
      ctx.fillRect(glitchX - 14, bodyY + 10 + (i % 2) * 14, 28, 8);
    }
    return;
  }

  if (move.id === "prime-drop") {
    const targetX = fighter.attack.targetX ?? x + fighter.facing * 110;
    const fallProgress = clamp((fighter.attack.time - 0.12) / 0.34, 0, 1);
    const crateY = -44 + fallProgress * (GROUND_Y + 28);
    ctx.strokeStyle = `rgba(${move.fx}, 0.85)`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(targetX, GROUND_Y + 2, 22 + Math.sin(progress * 22) * 3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(targetX - 14, GROUND_Y + 2);
    ctx.lineTo(targetX + 14, GROUND_Y + 2);
    ctx.moveTo(targetX, GROUND_Y - 14);
    ctx.lineTo(targetX, GROUND_Y + 18);
    ctx.stroke();
    ctx.fillStyle = `rgba(${move.fx}, 0.85)`;
    ctx.fillRect(targetX - 20, crateY, 40, 32);
    ctx.fillStyle = "rgba(41, 24, 8, 0.35)";
    ctx.fillRect(targetX - 12, crateY + 8, 24, 16);
    return;
  }

  if (move.id === "moon-bark") {
    ctx.strokeStyle = `rgba(${move.fx}, 0.8)`;
    ctx.lineWidth = 4;
    for (let i = 0; i < 3; i++) {
      const arcX = x + fighter.facing * (34 + i * 14);
      ctx.beginPath();
      ctx.arc(arcX, bodyY + 22, 20 + i * 10, -0.7, 0.7);
      ctx.stroke();
    }
    return;
  }

  if (move.id === "prompt-storm") {
    const frontX = x + fighter.facing * 80;
    ctx.fillStyle = `rgba(${move.fx}, 0.65)`;
    for (let i = 0; i < 3; i++) {
      const orbit = progress * Math.PI * 4 + i * 2.1;
      const orbX = x + Math.cos(orbit) * 24 + fighter.facing * 16;
      const orbY = bodyY + 24 + Math.sin(orbit) * 18;
      ctx.beginPath();
      ctx.arc(orbX, orbY, 8, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = `rgba(${move.fx}, 0.8)`;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(x + fighter.facing * 12, bodyY + 28);
    ctx.lineTo(frontX, bodyY + 4);
    ctx.lineTo(frontX, bodyY + 52);
    ctx.closePath();
    ctx.stroke();
  }
}

function drawAnnouncerBanner() {
  if (!state.announcerText || state.mode === "menu") return;
  const alpha = clamp(state.announcerTimer / 1.25, 0, 1);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "rgba(2, 7, 18, 0.55)";
  ctx.fillRect(WIDTH * 0.5 - 180, 118, 360, 42);
  ctx.strokeStyle = "#4cbfff";
  ctx.lineWidth = 3;
  ctx.strokeRect(WIDTH * 0.5 - 180, 118, 360, 42);
  ctx.fillStyle = "#ffe17d";
  ctx.font = "bold 24px 'Courier New', monospace";
  ctx.textAlign = "center";
  ctx.fillText(state.announcerText, WIDTH * 0.5, 146);
  ctx.globalAlpha = 1;
}

function drawFighter(fighter) {
  if (!fighter) return;
  const character = roster[fighter.rosterIndex];
  const x = fighter.x;
  const y = fighter.y;
  const bodyY = getBodyY(fighter);

  const attackPose = fighter.attack ? fighter.attack.type : null;
  const armReach =
    attackPose === "special" ? 36 : attackPose === "kick" ? 24 : attackPose === "punch" ? 16 : 0;

  ctx.save();
  if (fighter.hurtFlash > 0) {
    ctx.globalAlpha = 0.95;
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    ctx.fillRect(x - 54, bodyY - 16, 108, fighter.h + 34);
  }

  ctx.translate(x, 0);
  ctx.scale(fighter.facing, 1);
  ctx.translate(-x, 0);

  ctx.strokeStyle = "#111722";
  ctx.lineWidth = 4;

  if (character.animal) {
    ctx.fillStyle = "#f0c46c";
    ctx.beginPath();
    ctx.ellipse(x, bodyY + 20, 24, 26, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - 14, bodyY - 4);
    ctx.lineTo(x - 4, bodyY - 24);
    ctx.lineTo(x + 2, bodyY - 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + 14, bodyY - 4);
    ctx.lineTo(x + 4, bodyY - 24);
    ctx.lineTo(x - 2, bodyY - 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#e9dbc2";
    ctx.beginPath();
    ctx.arc(x, bodyY + 6, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else {
    if (character.cape) {
      ctx.fillStyle = "#1a2054";
      ctx.beginPath();
      ctx.moveTo(x - 18, bodyY + 18);
      ctx.lineTo(x - 54, bodyY + 38);
      ctx.lineTo(x - 46, bodyY + 98);
      ctx.lineTo(x - 16, bodyY + 64);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#d5e7ff";
      ctx.font = "bold 18px 'Courier New', monospace";
      ctx.textAlign = "center";
      ctx.fillText("X", x - 39, bodyY + 72);
    }
    ctx.fillStyle = character.suit;
    ctx.fillRect(x - 22, bodyY + 8, 44, 58);
    ctx.strokeRect(x - 22, bodyY + 8, 44, 58);
    if (character.hoodie) {
      ctx.fillStyle = "#3a3f4a";
      ctx.fillRect(x - 24, bodyY + 4, 48, 14);
      ctx.strokeRect(x - 24, bodyY + 4, 48, 14);
    }
    ctx.fillStyle = character.skin;
    ctx.beginPath();
    ctx.arc(x, bodyY - 12, 17, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    if (character.glasses) {
      ctx.strokeStyle = "#d7ecff";
      ctx.lineWidth = 2;
      ctx.strokeRect(x - 11, bodyY - 18, 8, 5);
      ctx.strokeRect(x + 3, bodyY - 18, 8, 5);
      ctx.beginPath();
      ctx.moveTo(x - 3, bodyY - 15);
      ctx.lineTo(x + 3, bodyY - 15);
      ctx.stroke();
      ctx.strokeStyle = "#111722";
      ctx.lineWidth = 4;
    }
    if (character.tie) {
      ctx.fillStyle = "#ff744f";
      ctx.beginPath();
      ctx.moveTo(x, bodyY + 14);
      ctx.lineTo(x - 5, bodyY + 26);
      ctx.lineTo(x + 5, bodyY + 26);
      ctx.closePath();
      ctx.fill();
    }
  }

  ctx.strokeStyle = "#1a2233";
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(x - 12, bodyY + 66);
  ctx.lineTo(x - 16, y + 2);
  ctx.moveTo(x + 12, bodyY + 66);
  ctx.lineTo(x + 18, y + 2);
  ctx.stroke();

  const guardOffset = fighter.block ? 10 : 0;
  ctx.beginPath();
  ctx.moveTo(x - 22, bodyY + 24);
  ctx.lineTo(x - 34 - armReach, bodyY + 44 - guardOffset);
  ctx.moveTo(x + 22, bodyY + 24);
  ctx.lineTo(x + 30 + armReach, bodyY + 44 - guardOffset);
  ctx.stroke();

  ctx.fillStyle = character.accent;
  ctx.fillRect(x - 24, bodyY + 8, 48, 5);
  ctx.fillRect(x - 28, y + 3, 56, 5);

  if (fighter.block) {
    ctx.fillStyle = "rgba(164, 232, 255, 0.5)";
    ctx.beginPath();
    ctx.arc(x + fighter.facing * 24, bodyY + 34, 12, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawRosterPanel() {
  const y = HEIGHT - PANEL_HEIGHT;
  const gradient = ctx.createLinearGradient(0, y, 0, HEIGHT);
  gradient.addColorStop(0, "#020914");
  gradient.addColorStop(1, "#01030b");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, y, WIDTH, PANEL_HEIGHT);
  ctx.strokeStyle = "#2f9ee1";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, y + 1);
  ctx.lineTo(WIDTH, y + 1);
  ctx.stroke();

  ctx.fillStyle = "#f0f6ff";
  ctx.font = "bold 21px 'Courier New', monospace";
  ctx.textAlign = "center";
  ctx.fillText("TECH KOMBAT: SILICON CLASH", WIDTH * 0.5, y + 30);

  const slotW = 124;
  const slotH = 78;
  const gap = 12;
  const totalW = roster.length * slotW + (roster.length - 1) * gap;
  const startX = Math.round((WIDTH - totalW) * 0.5);
  const slotY = y + 40;

  for (let i = 0; i < roster.length; i++) {
    const r = roster[i];
    const x = startX + i * (slotW + gap);
    const selected = i === state.playerIndex;
    const enemy = i === state.enemyIndex && state.mode !== "menu";
    ctx.fillStyle = selected ? "#123869" : "#091c39";
    ctx.fillRect(x, slotY, slotW, slotH);
    ctx.strokeStyle = enemy ? "#ff4f4f" : selected ? "#7dd9ff" : "#2a4c7b";
    ctx.lineWidth = selected || enemy ? 3 : 2;
    ctx.strokeRect(x, slotY, slotW, slotH);

    ctx.fillStyle = r.skin;
    ctx.beginPath();
    ctx.arc(x + slotW * 0.5, slotY + 24, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = r.suit;
    ctx.fillRect(x + slotW * 0.5 - 14, slotY + 36, 28, 24);
    ctx.fillStyle = r.accent;
    ctx.fillRect(x + slotW * 0.5 - 16, slotY + 35, 32, 4);

    ctx.fillStyle = "#f0f4fa";
    ctx.font = "bold 15px 'Courier New', monospace";
    ctx.textAlign = "center";
    ctx.fillText(r.name, x + slotW * 0.5, slotY + 74);
  }
}

function drawHUD() {
  const playerName = roster[state.playerIndex].name;
  const enemyName = roster[state.enemyIndex].name;
  const playerSpecial = state.player ? getSpecial(state.player).name : getSpecial(state.playerIndex).name;
  const enemySpecial = state.enemy ? getSpecial(state.enemy).name : getSpecial(state.enemyIndex).name;
  const hpPlayer = state.player ? state.player.hp : MAX_HEALTH;
  const hpEnemy = state.enemy ? state.enemy.hp : MAX_HEALTH;

  drawHealthBar(playerName, hpPlayer, 48, 26, 300, false);
  drawHealthBar(enemyName, hpEnemy, WIDTH - 348, 26, 300, true);
  drawSuperBar(state.player ? state.player.superMeter : 0, 48, 57, 300, false);
  drawSuperBar(state.enemy ? state.enemy.superMeter : 0, WIDTH - 348, 57, 300, true);

  drawRoundPips(state.playerScore, 362, 38, false);
  drawRoundPips(state.enemyScore, WIDTH - 362, 38, true);

  ctx.fillStyle = "#f2f5fb";
  ctx.font = "bold 30px 'Courier New', monospace";
  ctx.textAlign = "center";
  ctx.fillText(Math.ceil(state.timer).toString().padStart(2, "0"), WIDTH * 0.5, 52);

  ctx.fillStyle = "#8edfff";
  ctx.font = "bold 13px 'Courier New', monospace";
  ctx.textAlign = "left";
  ctx.fillText("SPECIAL", 48, 79);
  ctx.font = "bold 11px 'Courier New', monospace";
  ctx.fillText(playerSpecial, 48, 94);
  ctx.textAlign = "right";
  ctx.font = "bold 13px 'Courier New', monospace";
  ctx.fillText("SPECIAL", WIDTH - 48, 79);
  ctx.font = "bold 11px 'Courier New', monospace";
  ctx.fillText(enemySpecial, WIDTH - 48, 94);

  if (state.player && state.player.comboCount > 1 && state.player.comboTimer > 0) {
    ctx.fillStyle = "#ffd95c";
    ctx.font = "bold 24px 'Courier New', monospace";
    ctx.textAlign = "left";
    ctx.fillText(`${state.player.comboCount} HIT`, 48, 112);
  }
  if (state.enemy && state.enemy.comboCount > 1 && state.enemy.comboTimer > 0) {
    ctx.fillStyle = "#ffd95c";
    ctx.font = "bold 24px 'Courier New', monospace";
    ctx.textAlign = "right";
    ctx.fillText(`${state.enemy.comboCount} HIT`, WIDTH - 48, 112);
  }

  if (state.mode === "round_over" || state.mode === "match_over") {
    ctx.font = "bold 40px 'Courier New', monospace";
    ctx.strokeStyle = "#0d1728";
    ctx.lineWidth = 5;
    ctx.strokeText(state.roundMessage, WIDTH * 0.5, 178);
    ctx.fillStyle = "#ffd654";
    ctx.fillText(state.roundMessage, WIDTH * 0.5, 178);
  }

  if (state.mode === "menu") {
    ctx.fillStyle = "rgba(3, 8, 18, 0.76)";
    ctx.fillRect(170, 124, WIDTH - 340, 218);
    ctx.strokeStyle = "#64cbff";
    ctx.lineWidth = 3;
    ctx.strokeRect(170, 124, WIDTH - 340, 218);

    ctx.fillStyle = "#f5f7ff";
    ctx.textAlign = "center";
    ctx.font = "bold 36px 'Courier New', monospace";
    ctx.fillText("TECH KOMBAT", WIDTH * 0.5, 174);
    ctx.font = "bold 22px 'Courier New', monospace";
    ctx.fillStyle = "#ffd54a";
    ctx.fillText("ARROW LEFT/RIGHT: CHOOSE FIGHTER", WIDTH * 0.5, 218);
    ctx.fillText("ARROWS: MOVE/JUMP  SPACE: PUNCH  A: KICK  B: BLOCK", WIDTH * 0.5, 250);
    ctx.fillText("A+SPACE: CHARACTER SPECIAL", WIDTH * 0.5, 282);
    ctx.fillText("F: TOGGLE FULLSCREEN", WIDTH * 0.5, 314);
    ctx.fillStyle = "#8ce6ff";
    ctx.fillText("PRESS ENTER TO START", WIDTH * 0.5, 334);
  }
}

function render() {
  ctx.save();
  if (state.cameraShake > 0) {
    const amt = state.cameraShake;
    const ox = (Math.random() * 2 - 1) * amt;
    const oy = (Math.random() * 2 - 1) * amt * 0.6;
    ctx.translate(ox, oy);
  }

  drawGridBackground();
  drawHUD();
  drawFighter(state.player);
  drawAttackEffect(state.player);
  drawFighter(state.enemy);
  drawAttackEffect(state.enemy);
  drawAnnouncerBanner();
  drawRosterPanel();
  ctx.restore();

  if (state.hitFlash > 0.01) {
    ctx.fillStyle = `rgba(255, 255, 255, ${state.hitFlash * 0.5})`;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  }
}

function loop(ts) {
  const dt = Math.min(0.05, (ts - lastTs) / 1000);
  lastTs = ts;
  if (!manualStepping) {
    accumulator += dt;
    while (accumulator >= FIXED_DT) {
      step(FIXED_DT);
      accumulator -= FIXED_DT;
    }
    render();
  }
  requestAnimationFrame(loop);
}

function toCanvasPoint(evt) {
  const rect = canvas.getBoundingClientRect();
  const sx = WIDTH / rect.width;
  const sy = HEIGHT / rect.height;
  return {
    x: (evt.clientX - rect.left) * sx,
    y: (evt.clientY - rect.top) * sy,
  };
}

function maybePickRoster(px, py) {
  if (state.mode !== "menu") return;
  const y = HEIGHT - PANEL_HEIGHT;
  const slotW = 124;
  const slotH = 78;
  const gap = 12;
  const totalW = roster.length * slotW + (roster.length - 1) * gap;
  const startX = Math.round((WIDTH - totalW) * 0.5);
  const slotY = y + 40;
  if (py < slotY || py > slotY + slotH) return;
  const offset = px - startX;
  if (offset < 0) return;
  const stride = slotW + gap;
  const slot = Math.floor(offset / stride);
  if (slot < 0 || slot >= roster.length) return;
  const local = offset % stride;
  if (local > slotW) return;
  state.playerIndex = slot;
  if (state.enemyIndex === state.playerIndex) {
    state.enemyIndex = pickEnemyIndex();
  }
  playSfx("menuMove");
}

async function toggleFullscreen() {
  if (!document.fullscreenElement) {
    await cabinet.requestFullscreen();
  } else {
    await document.exitFullscreen();
  }
}

window.addEventListener("keydown", (evt) => {
  unlockAudio().catch(() => {});
  pressInputCodes([evt.code]);

  if (
    evt.code === "ArrowLeft" ||
    evt.code === "ArrowRight" ||
    evt.code === "ArrowUp" ||
    evt.code === "Space" ||
    evt.code === "KeyA" ||
    evt.code === "KeyB" ||
    evt.code === "Enter" ||
    evt.code === "KeyF"
  ) {
    evt.preventDefault();
  }
});

window.addEventListener("keyup", (evt) => {
  releaseInputCodes([evt.code]);
});

canvas.addEventListener("pointermove", (evt) => {
  pointer = toCanvasPoint(evt);
});

canvas.addEventListener("pointerdown", (evt) => {
  if (evt.pointerType === "touch" && !evt.isPrimary) return;
  unlockAudio().catch(() => {});
  pointer = toCanvasPoint(evt);
  maybePickRoster(pointer.x, pointer.y);
});

for (const button of controlButtons) {
  button.addEventListener("pointerdown", (evt) => {
    evt.preventDefault();
    unlockAudio().catch(() => {});
    const codes = getControlCodes(button.dataset.codes || "");
    pressInputCodes(codes);
    activeControlPointers.set(evt.pointerId, { button, codes });
    button.classList.add("is-active");
    if (typeof button.setPointerCapture === "function") {
      try {
        button.setPointerCapture(evt.pointerId);
      } catch {
        // Synthetic pointer events used in tests may not support capture.
      }
    }
  });

  button.addEventListener("pointerup", (evt) => {
    clearActiveControl(evt.pointerId);
  });

  button.addEventListener("pointercancel", (evt) => {
    clearActiveControl(evt.pointerId);
  });

  button.addEventListener("lostpointercapture", (evt) => {
    clearActiveControl(evt.pointerId);
  });
}

window.addEventListener("blur", clearAllActiveControls);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) clearAllActiveControls();
});

window.render_game_to_text = () => {
  const payload = {
    coordinateSystem:
      "origin=(0,0) top-left; +x right; +y down; units are canvas pixels on a 960x540 field",
    mode: state.mode,
    round: state.round,
    timer: Number(state.timer.toFixed(2)),
    message: state.roundMessage,
    player: state.player
      ? {
          name: roster[state.player.rosterIndex].name,
          specialName: getSpecial(state.player).name,
          x: Number(state.player.x.toFixed(1)),
          y: Number(state.player.y.toFixed(1)),
          vx: Number(state.player.vx.toFixed(1)),
          vy: Number(state.player.vy.toFixed(1)),
          hp: Number(state.player.hp.toFixed(1)),
          superMeter: Number(state.player.superMeter.toFixed(1)),
          comboCount: state.player.comboCount,
          comboTimer: Number(state.player.comboTimer.toFixed(2)),
          rounds: state.playerScore,
          facing: state.player.facing,
          grounded: state.player.grounded,
          block: state.player.block,
          hitStun: Number(state.player.hitStun.toFixed(2)),
          attack: state.player.attack
            ? {
                type: state.player.attack.type,
                name:
                  state.player.attack.type === "special" ? getSpecial(state.player).name : state.player.attack.type,
                t: Number(state.player.attack.time.toFixed(2)),
              }
            : null,
        }
      : null,
    enemy: state.enemy
      ? {
          name: roster[state.enemy.rosterIndex].name,
          specialName: getSpecial(state.enemy).name,
          x: Number(state.enemy.x.toFixed(1)),
          y: Number(state.enemy.y.toFixed(1)),
          vx: Number(state.enemy.vx.toFixed(1)),
          vy: Number(state.enemy.vy.toFixed(1)),
          hp: Number(state.enemy.hp.toFixed(1)),
          superMeter: Number(state.enemy.superMeter.toFixed(1)),
          comboCount: state.enemy.comboCount,
          comboTimer: Number(state.enemy.comboTimer.toFixed(2)),
          rounds: state.enemyScore,
          facing: state.enemy.facing,
          grounded: state.enemy.grounded,
          block: state.enemy.block,
          hitStun: Number(state.enemy.hitStun.toFixed(2)),
          attack: state.enemy.attack
            ? {
                type: state.enemy.attack.type,
                name:
                  state.enemy.attack.type === "special" ? getSpecial(state.enemy).name : state.enemy.attack.type,
                t: Number(state.enemy.attack.time.toFixed(2)),
              }
            : null,
        }
      : null,
    roster: {
      selectedPlayer: roster[state.playerIndex].name,
      selectedEnemy: roster[state.enemyIndex].name,
      names: roster.map((r) => r.name),
      selectedPlayerSpecial: getSpecial(state.playerIndex).name,
      selectedEnemySpecial: getSpecial(state.enemyIndex).name,
    },
    announcer: {
      text: state.announcerText,
      timer: Number(state.announcerTimer.toFixed(2)),
    },
    ui: {
      mobileControlsVisible: mobileControls
        ? window.getComputedStyle(mobileControls).display !== "none"
        : false,
    },
    fullscreen: Boolean(document.fullscreenElement),
    pointer: { x: Number(pointer.x.toFixed(1)), y: Number(pointer.y.toFixed(1)) },
  };
  return JSON.stringify(payload);
};

window.advanceTime = async (ms) => {
  manualStepping = true;
  const steps = Math.max(1, Math.round(ms / (FIXED_DT * 1000)));
  for (let i = 0; i < steps; i++) {
    step(FIXED_DT);
  }
  render();
};

window.addEventListener("resize", () => render());

backToMenu();
render();
requestAnimationFrame(loop);
