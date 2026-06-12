/* ============================================================
   EducaRZ - Rompecabezas numerico 3D (Juego 5, 4 Basico)
   Taller: encaja cada pieza (descomposicion) en el caballete
   del numero que representa.
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

const GAME_NUMBER = 5;
const NEXT_URL = 'cuarto-basico-3d.html?viaje=6';

if(!window.THREE){
  window.location.href = 'juego-representaciones.html';
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
const ambient = new Audio('sonidos/representaciones.mp3');
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

function formatNumber(n){
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function splitDigits(n){
  return String(n).padStart(4, '0').split('');
}

function placeValueText(number){
  const [um, c, d, u] = splitDigits(number).map(Number);
  const parts = [];
  if(um) parts.push(um + '.000');
  if(c) parts.push(c + '00');
  if(d) parts.push(d + '0');
  if(u) parts.push(String(u));
  return parts.join(' + ');
}

function placeValueShort(number){
  const [um, c, d, u] = splitDigits(number);
  return um + ' UM + ' + c + ' C + ' + d + ' D + ' + u + ' U';
}

function speakPlaceValue(number){
  const [um, c, d, u] = splitDigits(number).map(Number);
  const parts = [];
  if(um) parts.push(um + ' unidades de mil');
  if(c) parts.push(c + ' centenas');
  if(d) parts.push(d + ' decenas');
  if(u) parts.push(u + ' unidades');
  return 'Representación formada por ' + parts.join(', ');
}

/* ============================================================
   ESCENA (taller)
   ============================================================ */
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffe8c2);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 9.5, 14.5);
camera.lookAt(0, 1.6, 0.5);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
container.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xfff6e6, 0xc9a06b, 0.9));
const lamp = new THREE.DirectionalLight(0xfff1d0, 0.85);
lamp.position.set(8, 14, 9);
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

/* ---------- Local del taller ---------- */
const floorTex = canvasTexture(512, 512, ctx => {
  ctx.fillStyle = '#c9974f';
  ctx.fillRect(0, 0, 512, 512);
  ctx.strokeStyle = '#b07f3a';
  ctx.lineWidth = 5;
  for(let i = 0; i <= 8; i++){
    ctx.beginPath(); ctx.moveTo(0, i * 64); ctx.lineTo(512, i * 64); ctx.stroke();
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
  new THREE.BoxGeometry(32, 9, 0.4),
  new THREE.MeshLambertMaterial({ color: 0xf6dcb1 })
);
backWall.position.set(0, 4.5, -7);
scene.add(backWall);

[-16, 16].forEach(x => {
  const side = new THREE.Mesh(
    new THREE.BoxGeometry(0.4, 9, 22),
    new THREE.MeshLambertMaterial({ color: 0xecd09e })
  );
  side.position.set(x, 4.5, 4);
  scene.add(side);
});

const bannerTex = canvasTexture(1024, 220, ctx => {
  ctx.fillStyle = '#fb8500';
  ctx.fillRect(0, 0, 1024, 220);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 100px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🧩 TALLER DE NÚMEROS', 512, 110);
});
const banner = new THREE.Mesh(
  new THREE.PlaneGeometry(11, 2.4),
  new THREE.MeshBasicMaterial({ map: bannerTex })
);
banner.position.set(0, 6.8, -6.78);
scene.add(banner);

/* repisas decorativas con tarros de pintura */
[-9.5, 9.5].forEach(x => {
  const shelf = new THREE.Mesh(
    new THREE.BoxGeometry(6, 0.18, 1.1),
    new THREE.MeshLambertMaterial({ color: 0x8d5a3a })
  );
  shelf.position.set(x, 4.6, -6.4);
  scene.add(shelf);
  [0xe63946, 0x457b9d, 0x2a9d8f, 0xffb703, 0x8338ec].forEach((c, i) => {
    const can = new THREE.Mesh(
      new THREE.CylinderGeometry(0.32, 0.32, 0.7, 10),
      new THREE.MeshLambertMaterial({ color: c })
    );
    can.position.set(x - 2.2 + i * 1.1, 5.05, -6.4);
    scene.add(can);
  });
});

/* mesa de trabajo para las piezas */
const bench = new THREE.Mesh(
  new THREE.BoxGeometry(17, 1, 2.6),
  new THREE.MeshLambertMaterial({ color: 0xb08968 })
);
bench.position.set(0, 0.5, 7.2);
bench.castShadow = bench.receiveShadow = true;
scene.add(bench);

/* ============================================================
   CABALLETES (numeros secretos)
   ============================================================ */
const PIECE_COLORS = ['#e63946', '#457b9d', '#2a9d8f', '#8338ec', '#fb8500', '#d81159'];
const boards = [];
const boardHitMeshes = [];
const hitMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });

const BOARD_POS = [
  [-9, -1], [-5.4, -1], [-1.8, -1], [1.8, -1], [5.4, -1], [9, -1]
];

function boardTexture(number){
  return canvasTexture(512, 360, ctx => {
    ctx.fillStyle = '#fffdf5';
    ctx.fillRect(0, 0, 512, 360);
    ctx.strokeStyle = '#8d5a3a';
    ctx.lineWidth = 14;
    ctx.strokeRect(7, 7, 498, 346);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#e76f51';
    ctx.font = 'bold 44px Arial';
    ctx.fillText('🧩 Número secreto', 256, 70);
    ctx.fillStyle = '#1d3557';
    ctx.font = 'bold 130px Arial';
    ctx.fillText(formatNumber(number), 256, 210);
    // hueco para la pieza
    ctx.fillStyle = '#e0d4c0';
    ctx.fillRect(40, 250, 432, 86);
    ctx.strokeStyle = '#b8a88f';
    ctx.lineWidth = 6;
    ctx.setLineDash([14, 10]);
    ctx.strokeRect(40, 250, 432, 86);
  });
}

function buildBoard(index, x, z){
  const g = new THREE.Group();

  // patas del caballete
  [-0.9, 0.9].forEach(dx => {
    const leg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.1, 2.6, 8),
      new THREE.MeshLambertMaterial({ color: 0x8d5a3a })
    );
    leg.position.set(dx, 1.3, -0.25);
    leg.rotation.x = 0.18;
    leg.castShadow = true;
    g.add(leg);
  });

  // tablero
  const panel = new THREE.Mesh(
    new THREE.BoxGeometry(3.05, 2.3, 0.16),
    new THREE.MeshLambertMaterial({ color: 0xd9b08c })
  );
  panel.position.set(0, 2.1, 0.05);
  panel.rotation.x = -0.12;
  panel.castShadow = true;
  g.add(panel);

  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(2.85, 2.1),
    new THREE.MeshBasicMaterial({ map: null })
  );
  face.position.set(0, 2.1, 0.15);
  face.rotation.x = -0.12;
  g.add(face);

  const hit = new THREE.Mesh(new THREE.BoxGeometry(3.45, 3.7, 2.6), hitMat);
  hit.position.set(0, 1.9, 0);
  hit.userData.boardIndex = index;
  g.add(hit);
  boardHitMeshes.push(hit);

  g.position.set(x, 0, z);
  scene.add(g);

  return { group: g, face, x, z, number: 0, piece: null };
}

BOARD_POS.forEach(([x, z], i) => boards.push(buildBoard(i, x, z)));

/* ============================================================
   PIEZAS DE ROMPECABEZAS
   ============================================================ */
let pieces = [];
const PIECE_HOMES = [-7, -4.2, -1.4, 1.4, 4.2, 7].map(x => new THREE.Vector3(x, 1.35, 7.2));

function pieceTexture(text, color){
  return canvasTexture(512, 224, ctx => {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 512, 224);
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = 12;
    ctx.strokeRect(6, 6, 500, 212);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    let size = 64;
    ctx.font = 'bold ' + size + 'px Arial';
    while(ctx.measureText(text).width > 470 && size > 30){
      size -= 4;
      ctx.font = 'bold ' + size + 'px Arial';
    }
    ctx.fillText(text, 256, 112);
  });
}

function buildPiece(number, idx){
  const text = Math.random() < 0.5 ? placeValueText(number) : placeValueShort(number);
  const color = PIECE_COLORS[idx % PIECE_COLORS.length];
  const tex = pieceTexture(text, color);
  const sideMat = new THREE.MeshLambertMaterial({ color: 0x9a6a3f });
  const faceMat = new THREE.MeshBasicMaterial({ map: tex });

  const root = new THREE.Group();
  const tile = new THREE.Mesh(
    new THREE.BoxGeometry(2.5, 1.1, 0.2),
    [sideMat, sideMat, sideMat, sideMat, faceMat, faceMat]
  );
  tile.castShadow = true;
  root.add(tile);

  // "orejas" de pieza de rompecabezas
  [[-1.25, 0], [1.25, 0]].forEach(([dx]) => {
    const knob = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.2, 0.2, 12),
      new THREE.MeshLambertMaterial({ color: new THREE.Color(color) })
    );
    knob.rotation.x = Math.PI / 2;
    knob.position.set(dx, 0, 0);
    root.add(knob);
  });
  const knobTop = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.2, 0.2, 12),
    new THREE.MeshLambertMaterial({ color: new THREE.Color(color) })
  );
  knobTop.rotation.x = Math.PI / 2;
  knobTop.position.set(0, 0.55, 0);
  root.add(knobTop);

  const hit = new THREE.Mesh(new THREE.BoxGeometry(3, 1.9, 1), hitMat);
  hit.userData.pieceIdx = idx;
  root.add(hit);

  root.position.copy(PIECE_HOMES[idx]);
  root.rotation.x = -0.25;
  scene.add(root);

  return { root, tile, hit, value: number, speakText: speakPlaceValue(number), home: PIECE_HOMES[idx].clone(), board: null };
}

/* ============================================================
   RONDA
   ============================================================ */
function shuffle(arr){
  const a = arr.slice();
  for(let i = a.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function uniqueRandomNumbers(count, min, max, minGap){
  const out = [];
  let guard = 0;
  while(out.length < count && guard < 4000){
    guard++;
    const n = min + Math.floor(Math.random() * (max - min + 1));
    if(out.every(v => Math.abs(v - n) >= minGap)) out.push(n);
  }
  return out;
}

let held = null;
const tweens = [];

function tweenTo(group, target, dur, lift){
  tweens.push({ pos: group.position, from: group.position.clone(), to: target.clone(), t: 0, dur, lift: lift || 0 });
}

function setupRound(){
  pieces.forEach(p => scene.remove(p.root));
  pieces = [];
  held = null;
  completed = false;
  verifyBtn.disabled = false;
  nextBtn.disabled = true;
  feedback.className = 'hud-feedback';
  scoreEl.textContent = getScore();

  const numbers = uniqueRandomNumbers(6, 1000, 9999, 40);

  boards.forEach((b, i) => {
    b.number = numbers[i];
    b.piece = null;
    b.face.material.map = boardTexture(numbers[i]);
    b.face.material.needsUpdate = true;
  });

  shuffle(numbers).forEach((n, i) => {
    pieces.push(buildPiece(n, i));
  });

  goalEl.classList.remove('hidden');
}

/* ---------- Tomar / encajar ---------- */
function setHighlight(piece, on){
  piece.root.scale.setScalar(on ? 1.15 : 1);
}

function pickUp(piece){
  if(held) setHighlight(held, false);
  if(held === piece){
    dropAtHome(held);
    held = null;
    return;
  }
  held = piece;
  setHighlight(piece, true);
  const lift = piece.root.position.clone();
  lift.y += 0.8;
  tweenTo(piece.root, lift, 0.25);
  playClick();
  speak(piece.speakText);
}

function dropAtHome(piece){
  if(piece.board !== null){ boards[piece.board].piece = null; piece.board = null; }
  setHighlight(piece, false);
  piece.root.rotation.x = -0.25;
  tweenTo(piece.root, piece.home, 0.4, 1.2);
}

function placeOnBoard(piece, boardIdx){
  const board = boards[boardIdx];
  if(board.piece && board.piece !== piece){
    dropAtHome(board.piece);
  }
  if(piece.board !== null) boards[piece.board].piece = null;
  board.piece = piece;
  piece.board = boardIdx;
  setHighlight(piece, false);
  held = null;
  piece.root.rotation.x = -0.12; // misma inclinacion que el tablero
  // posicion del hueco en el caballete
  tweenTo(piece.root, new THREE.Vector3(board.x, 1.32, board.z + 0.32), 0.45, 1.4);
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
  const pieceHits = raycaster.intersectObjects(pieces.map(p => p.hit));
  const boardHits = raycaster.intersectObjects(boardHitMeshes);
  const piece = pieceHits.length ? pieces[pieceHits[0].object.userData.pieceIdx] : null;
  const board = boardHits.length ? boardHits[0].object.userData.boardIndex : null;
  if(piece && board !== null){
    // sin nada en la mano: prioridad a la pieza; con pieza tomada: al caballete
    return held ? { board } : { piece };
  }
  return { piece, board };
}

renderer.domElement.addEventListener('pointermove', e => {
  const { piece, board } = pick(e.clientX, e.clientY);
  renderer.domElement.style.cursor = (piece || board !== null) ? 'pointer' : 'default';
});

renderer.domElement.addEventListener('pointerup', e => {
  if(completed) return;
  const { piece, board } = pick(e.clientX, e.clientY);
  if(piece){
    pickUp(piece);
  } else if(board !== null && held){
    placeOnBoard(held, board);
  } else if(held){
    // clic en un espacio vacio: la pieza vuelve a la mesa
    dropAtHome(held);
    held = null;
  }
});

/* ============================================================
   VERIFICACION
   ============================================================ */
const confetti = [];
const confettiCols = [0xe63946, 0xffb703, 0x2a9d8f, 0x8338ec, 0x457b9d];
for(let i = 0; i < 60; i++){
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
    p.position.set((Math.random() - 0.5) * 16, 8 + Math.random() * 3, Math.random() * 8 - 2);
    p.userData.vy = -(1.5 + Math.random() * 2);
    p.userData.rx = Math.random() * 4;
    p.userData.rz = Math.random() * 4;
  });
}

let danceT = -1;

function verify(){
  if(completed) return;
  if(boards.some(b => !b.piece)){
    showFeedback('Encaja las 6 piezas en sus números primero.', 'bad');
    return;
  }
  if(held){ setHighlight(held, false); held = null; }

  const ok = boards.every(b => b.piece.value === b.number);

  if(ok){
    completed = true;
    const gained = 100 + GAME_NUMBER * 15;
    setScore(getScore() + gained);
    setUnlocked(GAME_NUMBER + 1);
    const PRAISES = ['¡Muy bien!', '¡Excelente trabajo!', '¡Lo lograste!', '¡Eres increíble!'];
    const praise = PRAISES[Math.floor(Math.random() * PRAISES.length)];
    showFeedback(praise + ' Ganaste ' + gained + ' puntos.', 'good');
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

  /* baile de victoria de los caballetes */
  if(danceT >= 0){
    danceT += dt;
    boards.forEach((b, i) => {
      b.group.rotation.z = Math.sin(danceT * 6 + i) * 0.05;
      b.group.position.y = Math.abs(Math.sin(danceT * 5 + i)) * 0.25;
    });
    if(danceT > 5){
      danceT = -1;
      boards.forEach(b => { b.group.rotation.z = 0; b.group.position.y = 0; });
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
  camera.lookAt(0, 1.6, 0.5);

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

speak('Toca una pieza y luego toca el caballete del número que representa.');
setTimeout(() => goalEl.classList.add('hidden'), 14000);

})();
