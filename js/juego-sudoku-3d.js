/* ============================================================
   EducaRZ - Sudoku matematico 3D (Juego 6, 4 Basico)
   Sala de juegos: completa el tablero 5x5 colocando tarjetas
   de operaciones. Filas y columnas sin repetir 1-5.
   ============================================================ */

(function(){
'use strict';

/* ---------- Progreso compartido ---------- */
function getScore(){ return Number(localStorage.getItem('cuartoBasicoScore') || '0'); }
function setScore(v){
  localStorage.setItem('cuartoBasicoScore', String(Math.max(0, v)));
  scoreEl.textContent = Math.max(0, v);
}
function getUnlocked(){ return Number(localStorage.getItem('cuartoBasicoUnlocked') || '1'); }
function setUnlocked(v){
  localStorage.setItem('cuartoBasicoUnlocked', String(Math.max(getUnlocked(), v)));
}

const GAME_NUMBER = 6;
const NEXT_URL = 'final.html';

if(!window.THREE){
  window.location.href = 'juego-sudoku.html';
  return;
}

/* ---------- HUD ---------- */
const container  = document.getElementById('scene-container');
const scoreEl    = document.getElementById('score');
const feedback   = document.getElementById('feedback');
const goalEl     = document.getElementById('goal');
const restartBtn = document.getElementById('restartBtn');
const verifyBtn  = document.getElementById('verifyBtn');
const nextBtn    = document.getElementById('nextBtn');
const backMenu   = document.getElementById('backMenu');
const loading    = document.getElementById('loadingOverlay');

let completed = false;
let feedbackTimer = null;

function speak(text){
  if(typeof speechSynthesis === 'undefined') return;
  speechSynthesis.cancel();
  const voice = new SpeechSynthesisUtterance(text);
  voice.lang = 'es-ES';
  voice.rate = 0.92;
  speechSynthesis.speak(voice);
}

function showFeedback(text, kind){
  feedback.textContent = text;
  feedback.className = 'hud-feedback ' + kind;
  speak(text);
  clearTimeout(feedbackTimer);
  if(kind === 'bad') feedbackTimer = setTimeout(() => { feedback.className = 'hud-feedback'; }, 4000);
}

/* ---------- Sonido ---------- */
const ambient = new Audio('sonidos/sudoku.mp3');
ambient.loop = true;
ambient.volume = 0.3;
function startAmbient(){
  ambient.play().then(() => {
    window.removeEventListener('pointerdown', startAmbient);
  }).catch(() => {});
}
startAmbient();
window.addEventListener('pointerdown', startAmbient);

const clickSound = new Audio('sonidos/click.mp3');
const winSound = new Audio('sonidos/confetiburbuja.mp3');
function playClick(){ try { clickSound.currentTime = 0; clickSound.play(); } catch(e){} }

function randomInt(min, max){
  return min + Math.floor(Math.random() * (max - min + 1));
}

function shuffle(arr){
  const a = arr.slice();
  for(let i = a.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ============================================================
   ESCENA (sala de juegos)
   ============================================================ */
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffe5e5);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 13.5, 12);
camera.lookAt(0, 0.6, 0.4);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
container.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xfff0f0, 0xc98f8f, 0.95));
const lamp = new THREE.DirectionalLight(0xfff1d0, 0.8);
lamp.position.set(8, 16, 9);
lamp.castShadow = true;
lamp.shadow.mapSize.set(1024, 1024);
lamp.shadow.camera.left = -16;
lamp.shadow.camera.right = 16;
lamp.shadow.camera.top = 16;
lamp.shadow.camera.bottom = -16;
scene.add(lamp);

function canvasTexture(w, h, draw){
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'));
  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 4;
  return tex;
}

/* ---------- Sala ---------- */
const floorTex = canvasTexture(512, 512, ctx => {
  const colors = ['#f8edeb', '#fcd5ce'];
  const s = 64;
  for(let y = 0; y < 8; y++) for(let x = 0; x < 8; x++){
    ctx.fillStyle = colors[(x + y) % 2];
    ctx.fillRect(x * s, y * s, s, s);
  }
});
floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping;
floorTex.repeat.set(4, 3);

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(50, 36),
  new THREE.MeshLambertMaterial({ map: floorTex })
);
floor.rotation.x = -Math.PI / 2;
floor.position.z = 4;
floor.receiveShadow = true;
scene.add(floor);

const backWall = new THREE.Mesh(
  new THREE.BoxGeometry(34, 9, 0.4),
  new THREE.MeshLambertMaterial({ color: 0xffd6d6 })
);
backWall.position.set(0, 4.5, -8.5);
scene.add(backWall);

[-17, 17].forEach(x => {
  const side = new THREE.Mesh(
    new THREE.BoxGeometry(0.4, 9, 24),
    new THREE.MeshLambertMaterial({ color: 0xf5c2c2 })
  );
  side.position.set(x, 4.5, 3.5);
  scene.add(side);
});

const bannerTex = canvasTexture(1024, 220, ctx => {
  ctx.fillStyle = '#e63946';
  ctx.fillRect(0, 0, 1024, 220);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 96px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🎲 SALA DE SUDOKU', 512, 110);
});
const banner = new THREE.Mesh(
  new THREE.PlaneGeometry(11, 2.4),
  new THREE.MeshBasicMaterial({ map: bannerTex })
);
banner.position.set(0, 6.6, -8.28);
scene.add(banner);

/* dados decorativos gigantes */
function decorDie(x, z, s, rot){
  const dieTex = canvasTexture(128, 128, ctx => {
    ctx.fillStyle = '#fffdf5';
    ctx.fillRect(0, 0, 128, 128);
    ctx.fillStyle = '#e63946';
    [[64, 64], [32, 32], [96, 96], [32, 96], [96, 32]].forEach(([px, py]) => {
      ctx.beginPath(); ctx.arc(px, py, 11, 0, Math.PI * 2); ctx.fill();
    });
  });
  const die = new THREE.Mesh(
    new THREE.BoxGeometry(s, s, s),
    new THREE.MeshLambertMaterial({ map: dieTex })
  );
  die.position.set(x, s / 2, z);
  die.rotation.y = rot;
  die.castShadow = true;
  scene.add(die);
}
decorDie(-12.5, -5, 2.2, 0.5);
decorDie(13, -4.5, 1.7, -0.3);
decorDie(11.8, -6.5, 1.2, 0.9);

/* ============================================================
   TABLERO 5x5 (sobre una mesa baja)
   ============================================================ */
const CELL = 1.62;
const GRID_Z0 = -5.6; // fila 0
const GRID_Y = 1.06;

const table = new THREE.Mesh(
  new THREE.BoxGeometry(9.6, 1, 9.6),
  new THREE.MeshLambertMaterial({ color: 0xb05656 })
);
table.position.set(0, 0.5, GRID_Z0 + CELL * 2);
table.castShadow = table.receiveShadow = true;
scene.add(table);

const boardBase = new THREE.Mesh(
  new THREE.BoxGeometry(8.9, 0.16, 8.9),
  new THREE.MeshLambertMaterial({ color: 0x7a2e3a })
);
boardBase.position.set(0, 1.02, GRID_Z0 + CELL * 2);
scene.add(boardBase);

const VALUE_COLORS = { 1: '#e63946', 2: '#457b9d', 3: '#2a9d8f', 4: '#8338ec', 5: '#fb8500' };

function fixedCellTexture(value){
  return canvasTexture(196, 196, ctx => {
    ctx.fillStyle = '#fffdf5';
    ctx.fillRect(0, 0, 196, 196);
    ctx.strokeStyle = '#7a2e3a';
    ctx.lineWidth = 10;
    ctx.strokeRect(5, 5, 186, 186);
    ctx.fillStyle = VALUE_COLORS[value];
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 130px Arial';
    ctx.fillText(String(value), 98, 108);
  });
}

const emptyCellTex = canvasTexture(196, 196, ctx => {
  ctx.fillStyle = '#e8d8cf';
  ctx.fillRect(0, 0, 196, 196);
  ctx.strokeStyle = '#b89f93';
  ctx.lineWidth = 8;
  ctx.setLineDash([16, 12]);
  ctx.strokeRect(10, 10, 176, 176);
  ctx.fillStyle = '#b89f93';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 110px Arial';
  ctx.fillText('?', 98, 108);
});

function makeSudokuSolution(){
  const base = [
    [1,2,3,4,5],
    [2,3,4,5,1],
    [3,4,5,1,2],
    [4,5,1,2,3],
    [5,1,2,3,4]
  ];
  const symbols = shuffle([1,2,3,4,5]);
  return base.map(row => row.map(v => symbols[v - 1]));
}

function makeOperationForResult(result, index){
  const type = index % 4;
  switch(type){
    case 0: {
      const a = randomInt(1, result);
      return a + ' + ' + (result - a);
    }
    case 1: {
      const add = randomInt(1, 4);
      return (result + add) + ' - ' + add;
    }
    case 2: {
      const factors = [];
      for(let i = 1; i <= result; i++) if(result % i === 0) factors.push(i);
      const a = factors[randomInt(0, factors.length - 1)];
      return a + ' × ' + (result / a);
    }
    default: {
      const m = randomInt(1, 5);
      return (result * m) + ' ÷ ' + m;
    }
  }
}

function cellPos(row, col){
  return new THREE.Vector3((col - 2) * CELL, GRID_Y, GRID_Z0 + row * CELL);
}

/* celdas: se crean una vez y se reconfiguran por ronda */
const cells = [];
const cellHitMeshes = [];
const hitMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });

for(let row = 0; row < 5; row++){
  for(let col = 0; col < 5; col++){
    const pos = cellPos(row, col);
    const face = new THREE.Mesh(
      new THREE.PlaneGeometry(CELL - 0.14, CELL - 0.14),
      new THREE.MeshBasicMaterial({ map: emptyCellTex })
    );
    face.rotation.x = -Math.PI / 2;
    face.position.copy(pos);
    face.position.y += 0.06;
    scene.add(face);

    const hit = new THREE.Mesh(new THREE.BoxGeometry(CELL, 2.2, CELL), hitMat);
    hit.position.copy(pos);
    hit.position.y += 1;
    hit.userData.cellIndex = row * 5 + col;
    scene.add(hit);
    cellHitMeshes.push(hit);

    cells.push({ face, hit, row, col, value: 0, fixed: false, tile: null, pos });
  }
}

/* ============================================================
   TARJETAS DE OPERACIONES
   ============================================================ */
let tiles = [];
const TILE_HOMES = [];
// dos filas frente a la mesa: 7 arriba, 6 abajo
for(let i = 0; i < 7; i++) TILE_HOMES.push(new THREE.Vector3(-7.2 + i * 2.4, 0.62, 5.6));
for(let i = 0; i < 6; i++) TILE_HOMES.push(new THREE.Vector3(-6 + i * 2.4, 0.62, 7.4));

function tileTexture(text){
  return canvasTexture(256, 160, ctx => {
    ctx.fillStyle = '#fffdf5';
    ctx.fillRect(0, 0, 256, 160);
    ctx.strokeStyle = '#e63946';
    ctx.lineWidth = 12;
    ctx.strokeRect(6, 6, 244, 148);
    ctx.fillStyle = '#1d3557';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    let size = 64;
    ctx.font = 'bold ' + size + 'px Arial';
    while(ctx.measureText(text).width > 220 && size > 30){
      size -= 4;
      ctx.font = 'bold ' + size + 'px Arial';
    }
    ctx.fillText(text, 128, 84);
  });
}

function buildTile(operation, value, idx){
  const tex = tileTexture(operation);
  const sideMat = new THREE.MeshLambertMaterial({ color: 0x9d2933 });
  const faceMat = new THREE.MeshBasicMaterial({ map: tex });

  const root = new THREE.Group();
  const card = new THREE.Mesh(
    new THREE.BoxGeometry(2.1, 0.18, 1.3),
    [sideMat, sideMat, faceMat, sideMat, sideMat, sideMat]
  );
  card.castShadow = true;
  root.add(card);

  const hit = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.6, 1.7), hitMat);
  hit.userData.tileIdx = idx;
  root.add(hit);

  root.position.copy(TILE_HOMES[idx]);
  scene.add(root);

  return { root, card, hit, value, operation, home: TILE_HOMES[idx].clone(), cell: null, baseScale: 1 };
}

/* ============================================================
   RONDA
   ============================================================ */
let held = null;
const tweens = [];

function tweenTo(group, target, dur, lift){
  tweens.push({ pos: group.position, from: group.position.clone(), to: target.clone(), t: 0, dur, lift: lift || 0 });
}

function setupRound(){
  tiles.forEach(t => scene.remove(t.root));
  tiles = [];
  held = null;
  completed = false;
  verifyBtn.disabled = false;
  nextBtn.disabled = true;
  feedback.className = 'hud-feedback';
  scoreEl.textContent = getScore();

  const solution = makeSudokuSolution();
  const fixedIndexes = shuffle([...Array(25).keys()]).slice(0, 12);
  const emptyCells = [];

  cells.forEach((cell, index) => {
    cell.value = solution[cell.row][cell.col];
    cell.fixed = fixedIndexes.includes(index);
    cell.tile = null;
    if(cell.fixed){
      cell.face.material.map = fixedCellTexture(cell.value);
    } else {
      cell.face.material.map = emptyCellTex;
      emptyCells.push(cell);
    }
    cell.face.material.needsUpdate = true;
  });

  shuffle(emptyCells.map(c => c.value)).forEach((value, i) => {
    const operation = makeOperationForResult(value, i);
    tiles.push(buildTile(operation, value, i));
  });

  goalEl.classList.remove('hidden');
}

/* ---------- Tomar / colocar ---------- */
function setHighlight(tile, on){
  tile.root.scale.setScalar(tile.baseScale * (on ? 1.15 : 1));
}

function pickUp(tile){
  if(held) setHighlight(held, false);
  if(held === tile){
    dropAtHome(held);
    held = null;
    return;
  }
  held = tile;
  setHighlight(tile, true);
  const lift = tile.root.position.clone();
  lift.y += 0.9;
  tweenTo(tile.root, lift, 0.25);
  playClick();
  speak(tile.operation.replace('×', 'por').replace('÷', 'dividido en').replace('-', 'menos').replace('+', 'más'));
}

function dropAtHome(tile){
  if(tile.cell !== null){ cells[tile.cell].tile = null; tile.cell = null; }
  tile.baseScale = 1;
  setHighlight(tile, false);
  tweenTo(tile.root, tile.home, 0.4, 1.2);
}

function placeInCell(tile, cellIdx){
  const cell = cells[cellIdx];
  if(cell.fixed){
    showFeedback('Esa celda ya tiene su número.', 'bad');
    return;
  }
  if(cell.tile && cell.tile !== tile){
    dropAtHome(cell.tile);
  }
  if(tile.cell !== null) cells[tile.cell].tile = null;
  cell.tile = tile;
  tile.cell = cellIdx;
  tile.baseScale = 0.72; // la tarjeta se encoge para calzar en la celda
  setHighlight(tile, false);
  held = null;
  const target = cell.pos.clone();
  target.y = GRID_Y + 0.16;
  tweenTo(tile.root, target, 0.45, 1.6);
  playClick();
}

/* ============================================================
   INTERACCION
   ============================================================ */
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

function pick(clientX, clientY){
  pointer.x = (clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const tileHits = raycaster.intersectObjects(tiles.map(t => t.hit));
  const cellHits = raycaster.intersectObjects(cellHitMeshes);
  const tile = tileHits.length ? tiles[tileHits[0].object.userData.tileIdx] : null;
  const cell = cellHits.length ? cellHits[0].object.userData.cellIndex : null;
  if(tile && cell !== null){
    // sin nada en la mano: prioridad a la tarjeta; con tarjeta tomada: a la celda
    return held ? { cell } : { tile };
  }
  return { tile, cell };
}

renderer.domElement.addEventListener('pointermove', e => {
  const { tile, cell } = pick(e.clientX, e.clientY);
  const interactive = tile || (cell !== null && (!cells[cell].fixed || held === null));
  renderer.domElement.style.cursor = interactive ? 'pointer' : 'default';
});

renderer.domElement.addEventListener('pointerup', e => {
  if(completed) return;
  const { tile, cell } = pick(e.clientX, e.clientY);
  if(tile){
    pickUp(tile);
  } else if(cell !== null && held){
    placeInCell(held, cell);
  } else if(cell !== null && cells[cell].fixed){
    speak(String(cells[cell].value));
  } else if(held){
    // clic en un espacio vacio: la tarjeta vuelve a su lugar
    dropAtHome(held);
    held = null;
  }
});

/* ============================================================
   VERIFICACION
   ============================================================ */
const confetti = [];
const confettiCols = [0xe63946, 0xffb703, 0x2a9d8f, 0x8338ec, 0x457b9d];
for(let i = 0; i < 70; i++){
  const piece = new THREE.Mesh(
    new THREE.PlaneGeometry(0.22, 0.22),
    new THREE.MeshBasicMaterial({ color: confettiCols[i % 5], side: THREE.DoubleSide })
  );
  piece.visible = false;
  confetti.push(piece);
  scene.add(piece);
}

function launchConfetti(){
  confetti.forEach(p => {
    p.visible = true;
    p.position.set((Math.random() - 0.5) * 16, 8 + Math.random() * 3, Math.random() * 9 - 3);
    p.userData.vy = -(1.5 + Math.random() * 2);
    p.userData.rx = Math.random() * 4;
    p.userData.rz = Math.random() * 4;
  });
}

let danceT = -1;

function verify(){
  if(completed) return;
  const emptyLeft = cells.filter(c => !c.fixed && !c.tile).length;
  if(emptyLeft > 0){
    showFeedback('Faltan ' + emptyLeft + ' celdas por completar.', 'bad');
    return;
  }
  if(held){ setHighlight(held, false); held = null; }

  const ok = cells.every(c => c.fixed || c.tile.value === c.value);

  if(ok){
    completed = true;
    const gained = 100 + GAME_NUMBER * 15;
    setScore(getScore() + gained);
    setUnlocked(GAME_NUMBER + 1);
    const PRAISES = ['¡Muy bien!', '¡Excelente trabajo!', '¡Lo lograste!', '¡Eres increíble!'];
    const praise = PRAISES[Math.floor(Math.random() * PRAISES.length)];
    showFeedback(praise + ' Ganaste ' + gained + ' puntos. ¡Completaste todos los juegos!', 'good');
    try { winSound.currentTime = 0; winSound.play(); } catch(e){}
    launchConfetti();
    danceT = 0;
    nextBtn.disabled = false;
    verifyBtn.disabled = true;
  } else {
    setScore(getScore() - 25);
    showFeedback('Inténtalo nuevamente. Se restaron 25 puntos.', 'bad');
  }
}

verifyBtn.addEventListener('click', verify);
restartBtn.addEventListener('click', () => { danceT = -1; setupRound(); });
nextBtn.addEventListener('click', () => {
  if(!completed) return;
  window.location.href = NEXT_URL;
});
backMenu.addEventListener('click', () => {
  window.location.href = 'cuarto-basico-3d.html';
});

/* ============================================================
   BUCLE
   ============================================================ */
const clock = new THREE.Clock();

function animate(){
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  const time = clock.elapsedTime;

  for(let i = tweens.length - 1; i >= 0; i--){
    const tw = tweens[i];
    tw.t += dt / tw.dur;
    const k = Math.min(1, tw.t);
    const e = 1 - Math.pow(1 - k, 3);
    tw.pos.lerpVectors(tw.from, tw.to, e);
    tw.pos.y += Math.sin(e * Math.PI) * tw.lift * 0.35;
    if(k >= 1){
      tw.pos.copy(tw.to);
      tweens.splice(i, 1);
    }
  }

  if(held && !tweens.some(tw => tw.pos === held.root.position)){
    held.root.position.y += Math.sin(time * 5) * 0.0035;
  }

  /* victoria: las tarjetas saltan en ola */
  if(danceT >= 0){
    danceT += dt;
    tiles.forEach((t, i) => {
      if(t.cell === null) return;
      const base = GRID_Y + 0.16;
      t.root.position.y = base + Math.abs(Math.sin(danceT * 4 + i * 0.5)) * 0.45;
    });
    if(danceT > 6){
      danceT = -1;
      tiles.forEach(t => {
        if(t.cell !== null) t.root.position.y = GRID_Y + 0.16;
      });
    }
  }

  confetti.forEach(p => {
    if(!p.visible) return;
    p.position.y += p.userData.vy * dt;
    p.rotation.x += p.userData.rx * dt;
    p.rotation.z += p.userData.rz * dt;
    if(p.position.y < 0.05) p.visible = false;
  });

  camera.position.x = Math.sin(time * 0.22) * 0.3;
  camera.lookAt(0, 0.6, 0.4);

  renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

/* ---------- Inicio ---------- */
if(GAME_NUMBER > getUnlocked()){
  window.location.href = 'cuarto-basico-3d.html';
  return;
}

scoreEl.textContent = getScore();
setupRound();
animate();

setTimeout(() => {
  loading.classList.add('fade');
  setTimeout(() => loading.remove(), 700);
}, 400);

speak('Resuelve cada operación y coloca su tarjeta en una celda con ese resultado. En cada fila y columna deben quedar los números uno, dos, tres, cuatro y cinco, sin repetir.');
setTimeout(() => goalEl.classList.add('hidden'), 14000);

})();
