// ===== DATA =====

const EXP_TABLE = [0, 10, 25, 45, 75, 120, 175, 250, 350, 500,700,1000,1500, 9999];

const LV_STATS = [
  null,
  { maxHp: 25, maxMp:  8, atk:  5, def:  3 },
  { maxHp: 35, maxMp: 12, atk:  7, def:  4 },
  { maxHp: 45, maxMp: 16, atk: 10, def:  6 },
  { maxHp: 58, maxMp: 20, atk: 13, def:  7 },
  { maxHp: 72, maxMp: 24, atk: 16, def:  9 },
  { maxHp: 88, maxMp: 30, atk: 20, def: 11 },
  { maxHp:105, maxMp: 36, atk: 24, def: 13 },
  { maxHp:125, maxMp: 42, atk: 28, def: 15 },
  { maxHp:150, maxMp: 50, atk: 33, def: 18 },
  { maxHp:180, maxMp: 60, atk: 40, def: 22 },
  { maxHp:220, maxMp: 70, atk: 48, def: 26 },
  { maxHp:270, maxMp: 80, atk: 56, def: 30 },
  { maxHp:330, maxMp: 90, atk: 65, def: 35 },
  { maxHp:400, maxMp: 100, atk: 75, def: 41 },
];

const SPELLS = [
  { name: 'メラ',    mp: 2, type: 'atk',  power: [10, 18], minLv: 1 },
  { name: 'ホイミ',  mp: 3, type: 'heal', power: [25, 40], minLv: 1 },
  { name: 'ギラ',    mp: 5, type: 'atk',  power: [22, 36], minLv: 4 },
  { name: 'ベホイミ', mp: 6, type: 'heal', power: [55, 80], minLv: 6 },
  { name: 'メラミ',  mp: 8, type: 'atk',  power: [42, 65], minLv: 7 },
  { name: 'メラゾマ', mp: 12, type: 'atk',  power: [70, 100], minLv: 10 },
];

const ENEMY_DEFS = [
  { name: 'スライム',       hp: 8,  atk: 3,  def: 1,  exp: 4,   shape: 'slime',   color: '#4488ff', minLv: 1 },
  { name: 'ドラキー',       hp: 15, atk: 6,  def: 2,  exp: 8,   shape: 'bat',     color: '#9955cc', minLv: 1 },
  { name: 'おおがらす',     hp: 20, atk: 9,  def: 3,  exp: 13,  shape: 'crow',    color: '#333333', minLv: 2 },
  { name: 'ゴースト',       hp: 24, atk: 11, def: 4,  exp: 18,  shape: 'ghost',   color: '#99bbcc', minLv: 3 },
  { name: 'メタルスライム', hp: 4,  atk: 6,  def: 25, exp: 115, shape: 'metal',   color: '#aabbee', minLv: 3 },
  { name: 'キメラ',         hp: 42, atk: 15, def: 6,  exp: 30,  shape: 'chimera', color: '#cc8822', minLv: 4, loot: true },
  { name: 'おどるほうせき', hp: 32, atk: 18, def: 8,  exp: 38,  shape: 'gem',     color: '#ff44aa', minLv: 5 },
  { name: 'ドラゴン',       hp: 85, atk: 24, def: 10, exp: 70,  shape: 'dragon',  color: '#cc3300', minLv: 7 },
];

// ===== STATE =====

const player = {
  lv: 1, exp: 0,
  hp: 25, maxHp: 25,
  mp: 8,  maxMp: 8,
  atk: 5, def: 3,
  yakusou: 3,
};
let enemy = null;
let busy = false;
let hitFlash = 0;

// ===== CANVAS =====

const canvas = document.getElementById('scene');
const ctx = canvas.getContext('2d');

function drawBg() {
  const sky = ctx.createLinearGradient(0, 0, 0, 140);
  sky.addColorStop(0, '#0a1828');
  sky.addColorStop(1, '#1a3a5c');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 480, 140);

  const ground = ctx.createLinearGradient(0, 140, 0, 200);
  ground.addColorStop(0, '#1a3a1a');
  ground.addColorStop(1, '#0d1a0d');
  ctx.fillStyle = ground;
  ctx.fillRect(0, 140, 480, 60);

  // moon
  ctx.fillStyle = '#ffffcc';
  ctx.beginPath(); ctx.arc(40, 35, 18, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#1a3a5c';
  ctx.beginPath(); ctx.arc(48, 30, 15, 0, Math.PI * 2); ctx.fill();

  ctx.fillStyle = '#ffffff';
  [[80,20],[130,40],[200,15],[270,30],[350,18],[420,35],[100,60],[310,50]].forEach(([x, y]) => {
    ctx.beginPath(); ctx.arc(x, y, 1.2, 0, Math.PI * 2); ctx.fill();
  });
}

function drawEnemyShape(cx, cy) {
  if (!enemy) return;
  if (hitFlash > 0) {
    ctx.globalAlpha = hitFlash % 4 < 2 ? 0.25 : 1.0;
    hitFlash--;
  }
  ({
    slime:   drawSlime,
    metal:   drawMetalSlime,
    bat:     drawBat,
    crow:    drawCrow,
    ghost:   drawGhost,
    chimera: drawChimera,
    gem:     drawGem,
    dragon:  drawDragon,
  }[enemy.shape] || drawSlime)(cx, cy);
  ctx.globalAlpha = 1.0;
}

function drawSlime(cx, cy) {
  ctx.fillStyle = enemy.color;
  ctx.beginPath(); ctx.ellipse(cx, cy + 18, 32, 28, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx, cy - 2, 20, 20, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.arc(cx - 9, cy + 12, 5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 9, cy + 12, 5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(cx - 7, cy + 10, 2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 11, cy + 10, 2, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#000'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(cx, cy + 20, 7, 0.2, Math.PI - 0.2); ctx.stroke();
}

function drawMetalSlime(cx, cy) {
  const g = ctx.createRadialGradient(cx - 12, cy, 4, cx, cy + 18, 38);
  g.addColorStop(0, '#eeeeff'); g.addColorStop(1, '#6677bb');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.ellipse(cx, cy + 18, 32, 28, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx, cy - 2, 20, 20, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#223366';
  ctx.beginPath(); ctx.arc(cx - 9, cy + 12, 5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 9, cy + 12, 5, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#6677bb'; ctx.lineWidth = 7; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(cx + 28, cy + 22); ctx.quadraticCurveTo(cx + 52, cy, cx + 48, cy - 18); ctx.stroke();
}

function drawBat(cx, cy) {
  ctx.fillStyle = enemy.color;
  ctx.beginPath();
  ctx.moveTo(cx, cy + 8);
  ctx.bezierCurveTo(cx - 20, cy - 12, cx - 55, cy - 5, cx - 48, cy + 22);
  ctx.bezierCurveTo(cx - 35, cy + 28, cx - 18, cy + 18, cx, cy + 22);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx, cy + 8);
  ctx.bezierCurveTo(cx + 20, cy - 12, cx + 55, cy - 5, cx + 48, cy + 22);
  ctx.bezierCurveTo(cx + 35, cy + 28, cx + 18, cy + 18, cx, cy + 22);
  ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx, cy + 14, 14, 18, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.moveTo(cx - 8, cy - 2); ctx.lineTo(cx - 14, cy - 22); ctx.lineTo(cx - 1, cy - 2); ctx.fill();
  ctx.beginPath(); ctx.moveTo(cx + 8, cy - 2); ctx.lineTo(cx + 14, cy - 22); ctx.lineTo(cx + 1, cy - 2); ctx.fill();
  ctx.fillStyle = '#ff2200';
  ctx.beginPath(); ctx.arc(cx - 5, cy + 8, 3.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + 5, cy + 8, 3.5, 0, Math.PI * 2); ctx.fill();
}

function drawCrow(cx, cy) {
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath(); ctx.ellipse(cx, cy + 18, 18, 26, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx - 4, cy - 12, 15, 14, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#777700';
  ctx.beginPath(); ctx.moveTo(cx - 18, cy - 12); ctx.lineTo(cx - 36, cy - 7); ctx.lineTo(cx - 18, cy - 6); ctx.fill();
  ctx.fillStyle = '#ff8800';
  ctx.beginPath(); ctx.arc(cx - 10, cy - 14, 3.5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.arc(cx - 9, cy - 14, 1.5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#111';
  ctx.beginPath();
  ctx.moveTo(cx + 8, cy + 2);
  ctx.bezierCurveTo(cx + 38, cy - 18, cx + 52, cy + 18, cx + 18, cy + 32);
  ctx.bezierCurveTo(cx + 8, cy + 36, cx + 4, cy + 26, cx + 8, cy + 2);
  ctx.fill();
}

function drawGhost(cx, cy) {
  const w = Math.sin(Date.now() / 650) * 4;
  ctx.fillStyle = enemy.color;
  ctx.beginPath();
  ctx.arc(cx, cy, 28, Math.PI, 0);
  ctx.lineTo(cx + 28, cy + 42);
  for (let i = 6; i >= 0; i--) {
    ctx.lineTo(cx + 28 - (56 / 6) * i, cy + 42 + (i % 2 === 0 ? 8 : -8) + w);
  }
  ctx.lineTo(cx - 28, cy + 42);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#334455';
  ctx.beginPath(); ctx.ellipse(cx - 10, cy - 2, 7, 9, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx + 10, cy - 2, 7, 9, 0, 0, Math.PI * 2); ctx.fill();
}

function drawChimera(cx, cy) {
  ctx.fillStyle = '#aa6600';
  ctx.beginPath();
  ctx.moveTo(cx - 14, cy + 2);
  ctx.bezierCurveTo(cx - 58, cy - 28, cx - 68, cy + 18, cx - 22, cy + 32);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx + 14, cy + 2);
  ctx.bezierCurveTo(cx + 58, cy - 28, cx + 68, cy + 18, cx + 22, cy + 32);
  ctx.fill();
  ctx.fillStyle = enemy.color;
  ctx.beginPath(); ctx.ellipse(cx, cy + 22, 24, 33, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#dd8800';
  ctx.beginPath(); ctx.arc(cx, cy - 18, 19, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ffdd00';
  ctx.beginPath(); ctx.moveTo(cx - 4, cy - 12); ctx.lineTo(cx - 22, cy - 20); ctx.lineTo(cx - 4, cy - 6); ctx.fill();
  ctx.fillStyle = '#ff2200';
  ctx.beginPath(); ctx.arc(cx + 6, cy - 20, 4.5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.arc(cx + 7, cy - 20, 2, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#aa6600'; ctx.lineWidth = 6; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(cx - 10, cy + 50); ctx.lineTo(cx - 6, cy + 72); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + 10, cy + 50); ctx.lineTo(cx + 6, cy + 72); ctx.stroke();
}

function drawGem(cx, cy) {
  ctx.fillStyle = enemy.color;
  ctx.beginPath();
  ctx.moveTo(cx, cy - 34); ctx.lineTo(cx + 28, cy + 4);
  ctx.lineTo(cx, cy + 38); ctx.lineTo(cx - 28, cy + 4);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.beginPath(); ctx.moveTo(cx, cy - 34); ctx.lineTo(cx + 28, cy + 4); ctx.lineTo(cx, cy - 2); ctx.closePath(); ctx.fill();
  const t = Date.now() / 1000;
  ctx.fillStyle = '#fff';
  for (let i = 0; i < 4; i++) {
    const a = t * 2 + i * Math.PI / 2;
    ctx.beginPath(); ctx.arc(cx + Math.cos(a) * 42, cy + Math.sin(a) * 32, 2.5, 0, Math.PI * 2); ctx.fill();
  }
}

function drawDragon(cx, cy) {
  ctx.fillStyle = '#991100';
  ctx.beginPath();
  ctx.moveTo(cx - 18, cy + 8);
  ctx.bezierCurveTo(cx - 70, cy - 38, cx - 80, cy + 22, cx - 28, cy + 48);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx + 18, cy + 8);
  ctx.bezierCurveTo(cx + 70, cy - 38, cx + 80, cy + 22, cx + 28, cy + 48);
  ctx.fill();
  ctx.fillStyle = enemy.color;
  ctx.beginPath(); ctx.ellipse(cx, cy + 28, 28, 38, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx - 14, cy - 2);
  ctx.quadraticCurveTo(cx - 28, cy - 30, cx - 12, cy - 55);
  ctx.quadraticCurveTo(cx - 4, cy - 65, cx + 4, cy - 55);
  ctx.quadraticCurveTo(cx + 22, cy - 32, cx + 14, cy - 2);
  ctx.fill();
  ctx.fillStyle = '#771100';
  ctx.beginPath(); ctx.moveTo(cx - 6, cy - 60); ctx.lineTo(cx - 14, cy - 82); ctx.lineTo(cx + 2, cy - 60); ctx.fill();
  ctx.beginPath(); ctx.moveTo(cx + 6, cy - 60); ctx.lineTo(cx + 16, cy - 82); ctx.lineTo(cx + 2, cy - 60); ctx.fill();
  ctx.fillStyle = '#ffff00';
  ctx.beginPath(); ctx.arc(cx + 8, cy - 52, 5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.arc(cx + 9, cy - 52, 2.5, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#cc3300'; ctx.lineWidth = 12; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(cx + 24, cy + 55); ctx.quadraticCurveTo(cx + 68, cy + 65, cx + 62, cy + 32); ctx.stroke();
}

function drawEnemyHpBar() {
  if (!enemy) return;
  const ratio = Math.max(0, enemy.hp / enemy.maxHp);
  const x = 190, y = 162, w = 250, h = 12;
  ctx.fillStyle = '#330000'; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = ratio > 0.5 ? '#00cc44' : ratio > 0.25 ? '#ffcc00' : '#ff3300';
  ctx.fillRect(x, y, w * ratio, h);
  ctx.strokeStyle = '#555'; ctx.lineWidth = 1; ctx.strokeRect(x, y, w, h);
  ctx.fillStyle = '#eee'; ctx.font = '10px monospace'; ctx.textAlign = 'center';
  ctx.fillText(`${enemy.name}  HP ${enemy.hp} / ${enemy.maxHp}`, x + w / 2, y - 3);
}

function renderLoop() {
  ctx.clearRect(0, 0, 480, 200);
  drawBg();
  if (enemy && enemy.hp > 0) {
    const bob = Math.sin(Date.now() / 500) * 3;
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath(); ctx.ellipse(360, 155, 42, 9, 0, 0, Math.PI * 2); ctx.fill();
    drawEnemyShape(360, 85 + bob);
    drawEnemyHpBar();
  }
  requestAnimationFrame(renderLoop);
}

// ===== UI =====

function log(msg, cls = '') {
  const el = document.getElementById('battle-log');
  el.querySelectorAll('.cur').forEach(p => p.classList.remove('cur'));
  const p = document.createElement('p');
  p.className = ['cur', cls].filter(Boolean).join(' ');
  p.textContent = msg;
  el.appendChild(p);
  el.scrollTop = el.scrollHeight;
}

function updateHUD() {
  document.getElementById('lv').textContent = player.lv;
  document.getElementById('exp').textContent = player.exp;
  document.getElementById('next-exp').textContent = EXP_TABLE[player.lv] ?? '---';
  document.getElementById('hp').textContent = player.hp;
  document.getElementById('max-hp').textContent = player.maxHp;
  document.getElementById('mp').textContent = player.mp;
  document.getElementById('max-mp').textContent = player.maxMp;
  document.getElementById('item-count').textContent = player.yakusou;

  const hpRatio = player.hp / player.maxHp;
  const hpBar = document.getElementById('hp-bar');
  hpBar.style.width = (hpRatio * 100) + '%';
  hpBar.style.background = hpRatio > 0.5 ? '#00cc44' : hpRatio > 0.25 ? '#ffcc00' : '#ff3300';
  document.getElementById('mp-bar').style.width = (player.mp / player.maxMp * 100) + '%';
}

function setBusy(b) {
  busy = b;
  ['btn-attack', 'btn-magic', 'btn-item', 'btn-run'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.disabled = b;
  });
}

function closeSubMenu() {
  const sm = document.getElementById('sub-menu');
  sm.className = '';
  sm.innerHTML = '';
}

// ===== BATTLE LOGIC =====

function rand(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }

function calcDmg(atk, def) {
  const base = Math.max(1, atk - Math.floor(def / 2));
  return rand(Math.floor(base * 0.8), Math.ceil(base * 1.2));
}

function spawnEnemy() {
  const pool = ENEMY_DEFS.filter(e => e.minLv <= player.lv + 2);
  const def = pool[rand(0, pool.length - 1)];
  enemy = { ...def, maxHp: def.hp };
  document.getElementById('enemy-name').textContent = `${enemy.name} があらわれた！`;
  log(`${enemy.name} があらわれた！`, 'gold');
}

function doPlayerAttack() {
  if (busy) return;
  closeSubMenu();
  setBusy(true);
  const dmg = calcDmg(player.atk, enemy.def);
  enemy.hp = Math.max(0, enemy.hp - dmg);
  hitFlash = 10;
  log('勇者の こうげき！');
  setTimeout(() => {
    log(`${enemy.name} に ${dmg} のダメージ！`, 'dmg');
    if (enemy.hp <= 0) { setTimeout(onVictory, 500); return; }
    setTimeout(doEnemyTurn, 700);
  }, 350);
}

function doSpell(spell) {
  if (player.mp < spell.mp) { log('MPが足りない！', 'bad'); closeSubMenu(); return; }
  closeSubMenu();
  setBusy(true);
  player.mp -= spell.mp;
  updateHUD();
  log(`${spell.name}！`);
  setTimeout(() => {
    if (spell.type === 'heal') {
      const h = rand(spell.power[0], spell.power[1]);
      player.hp = Math.min(player.maxHp, player.hp + h);
      log(`HPが ${h} 回復した！`, 'heal');
      updateHUD();
      setTimeout(doEnemyTurn, 700);
    } else {
      const dmg = rand(spell.power[0], spell.power[1]);
      enemy.hp = Math.max(0, enemy.hp - dmg);
      hitFlash = 10;
      log(`${enemy.name} に ${dmg} のダメージ！`, 'dmg');
      if (enemy.hp <= 0) { setTimeout(onVictory, 500); return; }
      setTimeout(doEnemyTurn, 700);
    }
  }, 450);
}

function doItem() {
  if (player.yakusou <= 0) { log('やくそうを持っていない！', 'bad'); closeSubMenu(); return; }
  closeSubMenu();
  setBusy(true);
  player.yakusou--;
  const h = rand(30, 50);
  player.hp = Math.min(player.maxHp, player.hp + h);
  log('やくそう を使った。', 'heal');
  setTimeout(() => {
    log(`HPが ${h} 回復した！`, 'heal');
    updateHUD();
    setTimeout(doEnemyTurn, 700);
  }, 400);
}

function doRun() {
  if (busy) return;
  closeSubMenu();
  setBusy(true);
  if (Math.random() < 0.4) {
    log('うまく にげられた！', 'heal');
    setTimeout(() => { spawnEnemy(); setBusy(false); }, 900);
  } else {
    log('まわりこまれた！ にげられない！', 'bad');
    setTimeout(doEnemyTurn, 700);
  }
}

function doEnemyTurn() {
  const dmg = calcDmg(enemy.atk, player.def);
  player.hp = Math.max(0, player.hp - dmg);
  log(`${enemy.name} の こうげき！`);
  setTimeout(() => {
    log(`勇者は ${dmg} のダメージを受けた！`, 'bad');
    updateHUD();
    if (player.hp <= 0) { setTimeout(onGameOver, 500); return; }
    document.getElementById('enemy-name').textContent = enemy.name;
    setBusy(false);
  }, 350);
}

function onVictory() {
  log(`${enemy.name} をたおした！`, 'gold');
  setTimeout(() => {
    log(`けいけんち ${enemy.exp} を獲得！`, 'gold');
    player.exp += enemy.exp;
    if (enemy.loot && Math.random() < 0.35) {
      player.yakusou++;
      log('やくそう を手に入れた！', 'heal');
    }
    checkLevelUp();
    updateHUD();
    setTimeout(() => { spawnEnemy(); setBusy(false); }, 1000);
  }, 500);
}

function checkLevelUp() {
  while (player.lv < LV_STATS.length - 1 && player.exp >= EXP_TABLE[player.lv]) {
    player.lv++;
    const s = LV_STATS[player.lv];
    const hpDiff = s.maxHp - player.maxHp;
    const mpDiff = s.maxMp - player.maxMp;
    Object.assign(player, s);
    player.hp = Math.min(player.hp + hpDiff, player.maxHp);
    player.mp = Math.min(player.mp + mpDiff, player.maxMp);
    log(`レベルアップ！ Lv.${player.lv} になった！`, 'lv');
    log(`最大HP +${hpDiff}  最大MP +${mpDiff}`, 'lv');
  }
}

function onGameOver() {
  log('勇者は 死んでしまった...', 'bad');
  setTimeout(() => {
    log('GAME OVER', 'bad');
    document.getElementById('commands').innerHTML =
      '<button class="cmd-btn" style="grid-column:span 2" id="btn-retry">もう一度はじめる</button>';
    document.getElementById('btn-retry').onclick = onRestart;
  }, 800);
}

function onRestart() {
  Object.assign(player, { lv: 1, exp: 0, yakusou: 3 }, LV_STATS[1]);
  player.hp = player.maxHp;
  player.mp = player.maxMp;
  document.getElementById('commands').innerHTML = `
    <button class="cmd-btn" id="btn-attack">たたかう</button>
    <button class="cmd-btn" id="btn-magic">じゅもん</button>
    <button class="cmd-btn" id="btn-item">どうぐ</button>
    <button class="cmd-btn" id="btn-run">にげる</button>`;
  document.getElementById('battle-log').innerHTML = '';
  closeSubMenu();
  setupButtons();
  updateHUD();
  spawnEnemy();
  setBusy(false);
}

// ===== COMMAND MENUS =====

function showMagicMenu() {
  if (busy) return;
  const sm = document.getElementById('sub-menu');
  sm.className = 'open';
  sm.innerHTML = '';
  const available = SPELLS.filter(s => s.minLv <= player.lv);
  if (available.length === 0) {
    log('まだじゅもんを知らない', 'bad');
    sm.className = '';
    return;
  }
  available.forEach(spell => {
    const btn = document.createElement('button');
    btn.className = 'cmd-btn';
    btn.textContent = `${spell.name}  MP:${spell.mp}  ${spell.type === 'heal' ? '[ 回復 ]' : '[ 攻撃 ]'}`;
    btn.onclick = () => doSpell(spell);
    sm.appendChild(btn);
  });
  const back = document.createElement('button');
  back.className = 'cmd-btn';
  back.textContent = 'もどる';
  back.onclick = closeSubMenu;
  sm.appendChild(back);
}

function showItemMenu() {
  if (busy) return;
  const sm = document.getElementById('sub-menu');
  sm.className = 'open';
  sm.innerHTML = '';
  const btn = document.createElement('button');
  btn.className = 'cmd-btn';
  btn.textContent = `やくそう × ${player.yakusou}   HPを回復する`;
  btn.disabled = player.yakusou === 0;
  btn.onclick = doItem;
  sm.appendChild(btn);
  const back = document.createElement('button');
  back.className = 'cmd-btn';
  back.textContent = 'もどる';
  back.onclick = closeSubMenu;
  sm.appendChild(back);
}

function setupButtons() {
  document.getElementById('btn-attack').onclick = doPlayerAttack;
  document.getElementById('btn-magic').onclick = showMagicMenu;
  document.getElementById('btn-item').onclick = showItemMenu;
  document.getElementById('btn-run').onclick = doRun;
}

// ===== INIT =====

setupButtons();
updateHUD();
renderLoop();
log('旅人よ、戦いの準備はよいか？', 'gold');
spawnEnemy();
