/* ============================================================
   EducaRZ - Tira y afloja numerico 3D (Juego 4, 4 Basico)
   Campo deportivo: 4 duelos elefante vs leon. Coloca el signo
   correcto (>, <, =) en el centro de cada cuerda.
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

const GAME_NUMBER = 4;
const NEXT_URL = 'cuarto-basico-3d.html?viaje=5';

if(!window.THREE){
  window.location.href = 'juego-mayor-menor.html';
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
const ambient = new Audio('sonidos/mayor.mp3');
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
   ESCENA (campo deportivo)
   ============================================================ */
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x8fd3f4);
scene.fog = new THREE.Fog(0x8fd3f4, 55, 130);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(0, 13, 14.5);
camera.lookAt(0, 0, 0.8);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
container.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xcfeefc, 0x7ec850, 0.9));
const sunLight = new THREE.DirectionalLight(0xfff3d6, 0.95);
sunLight.position.set(12, 20, 10);
sunLight.castShadow = true;
sunLight.shadow.mapSize.set(1024, 1024);
sunLight.shadow.camera.left = -18;
sunLight.shadow.camera.right = 18;
sunLight.shadow.camera.top = 18;
sunLight.shadow.camera.bottom = -18;
scene.add(sunLight);

function canvasTexture(w, h, draw){
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'));
  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 4;
  return tex;
}

/* ---------- Campo ---------- */
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(90, 60),
  new THREE.MeshLambertMaterial({ color: 0x7ec850 })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

const arena = new THREE.Mesh(
  new THREE.BoxGeometry(20, 0.12, 15),
  new THREE.MeshLambertMaterial({ color: 0x95d96a })
);
arena.position.set(0, 0.06, 0.5);
arena.receiveShadow = true;
scene.add(arena);

/* lineas del campo */
const lineMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
[-9.9, 9.9].forEach(x => {
  const line = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.13, 15), lineMat);
  line.position.set(x, 0.07, 0.5);
  scene.add(line);
});

/* banderines */
[[-10, -7], [10, -7], [-10, 8], [10, 8]].forEach(([x, z], i) => {
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.06, 2.6, 6),
    new THREE.MeshLambertMaterial({ color: 0xdddddd })
  );
  pole.position.set(x, 1.3, z);
  scene.add(pole);
  const flag = new THREE.Mesh(
    new THREE.PlaneGeometry(0.9, 0.55),
    new THREE.MeshLambertMaterial({ color: [0xe63946, 0xffb703, 0x2a9d8f, 0x8338ec][i], side: THREE.DoubleSide })
  );
  flag.position.set(x + 0.45, 2.3, z);
  scene.add(flag);
});

/* cerros y arboles */
const hillMat = new THREE.MeshLambertMaterial({ color: 0x6aa84f });
const hillMat2 = new THREE.MeshLambertMaterial({ color: 0x93c47d });
[[-24, -18, 10], [2, -22, 13], [25, -16, 9], [-34, -4, 8], [35, -2, 10]].forEach(([x, z, h], i) => {
  const hill = new THREE.Mesh(new THREE.ConeGeometry(h + 4, h, 8), i % 2 ? hillMat : hillMat2);
  hill.position.set(x, h / 2 - 0.5, z);
  scene.add(hill);
});

const trunkMat = new THREE.MeshLambertMaterial({ color: 0x8d5a3a });
const leafMats = [0x2a9d4f, 0x4caf50, 0x357a38].map(c => new THREE.MeshLambertMaterial({ color: c }));
[[-14, -4], [-15, 3], [14, -4], [15, 3], [-13, 9], [13, 9]].forEach(([x, z], i) => {
  const s = 0.9 + (i % 3) * 0.25;
  const tree = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18 * s, 0.26 * s, 1.2 * s, 6), trunkMat);
  trunk.position.y = 0.6 * s;
  trunk.castShadow = true;
  const leaves = new THREE.Mesh(new THREE.ConeGeometry(1 * s, 2.4 * s, 7), leafMats[i % 3]);
  leaves.position.y = 2.2 * s;
  leaves.castShadow = true;
  tree.add(trunk, leaves);
  tree.position.set(x, 0, z);
  scene.add(tree);
});

/* nubes */
const cloudMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
const clouds = [];
for(let i = 0; i < 5; i++){
  const cloud = new THREE.Group();
  const k = 0.9 + Math.random();
  [[0,0,0,1.2],[1,0.15,0.2,0.85],[-1,0.1,-0.15,0.9]].forEach(([x,y,z,s]) => {
    const puff = new THREE.Mesh(new THREE.SphereGeometry(s * k, 10, 8), cloudMat);
    puff.position.set(x * k, y * k, z * k);
    cloud.add(puff);
  });
  cloud.position.set(-30 + Math.random() * 60, 11 + Math.random() * 5, -16 + Math.random() * 8);
  cloud.userData.speed = 0.4 + Math.random();
  clouds.push(cloud);
  scene.add(cloud);
}

/* ============================================================
   ANIMALES LOW-POLY
   ============================================================ */
function lam(color){ return new THREE.MeshLambertMaterial({ color }); }

function buildElephant(){
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.95, 0.9), lam(0x8d99ae));
  body.position.y = 0.85;
  body.castShadow = true;
  g.add(body);
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.75, 0.7), lam(0x8d99ae));
  head.position.set(0.95, 1.15, 0);
  head.castShadow = true;
  g.add(head);
  // orejas
  [-0.42, 0.42].forEach(z => {
    const ear = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.55, 0.08), lam(0x6d7a93));
    ear.position.set(0.8, 1.25, z);
    g.add(ear);
  });
  // trompa
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.14, 0.85, 8), lam(0x8d99ae));
  trunk.position.set(1.42, 0.78, 0);
  trunk.rotation.z = 0.5;
  g.add(trunk);
  // ojos
  [-0.2, 0.2].forEach(z => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), lam(0x1d3557));
    eye.position.set(1.34, 1.3, z);
    g.add(eye);
  });
  // patas
  [[-0.45, 0.3], [-0.45, -0.3], [0.45, 0.3], [0.45, -0.3]].forEach(([x, z]) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.45, 8), lam(0x6d7a93));
    leg.position.set(x, 0.22, z);
    g.add(leg);
  });
  return g;
}

function buildLion(){
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.85, 0.8), lam(0xe9b44c));
  body.position.y = 0.8;
  body.castShadow = true;
  g.add(body);
  // melena
  const mane = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.25, 12), lam(0xb3541e));
  mane.rotation.z = Math.PI / 2;
  mane.position.set(-0.85, 1.1, 0);
  g.add(mane);
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.55), lam(0xe9b44c));
  head.position.set(-1, 1.1, 0);
  head.castShadow = true;
  g.add(head);
  // hocico y ojos
  const snout = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.25, 0.3), lam(0xf6d186));
  snout.position.set(-1.33, 1, 0);
  g.add(snout);
  [-0.16, 0.16].forEach(z => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.055, 6, 6), lam(0x1d3557));
    eye.position.set(-1.31, 1.25, z);
    g.add(eye);
  });
  // cola
  const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.8, 6), lam(0xe9b44c));
  tail.position.set(0.7, 1.05, 0);
  tail.rotation.z = -0.7;
  g.add(tail);
  const tailTip = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 6), lam(0xb3541e));
  tailTip.position.set(1, 1.35, 0);
  g.add(tailTip);
  // patas
  [[-0.4, 0.26], [-0.4, -0.26], [0.4, 0.26], [0.4, -0.26]].forEach(([x, z]) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.13, 0.42, 8), lam(0xd9a13c));
    leg.position.set(x, 0.21, z);
    g.add(leg);
  });
  return g;
}

function numberSprite(n, color){
  const tex = canvasTexture(512, 180, ctx => {
    ctx.fillStyle = 'rgba(255,255,255,0.97)';
    ctx.strokeStyle = color;
    ctx.lineWidth = 12;
    const r = 28;
    ctx.beginPath();
    ctx.moveTo(r, 6);
    ctx.lineTo(512 - r, 6); ctx.quadraticCurveTo(506, 6, 506, r + 6);
    ctx.lineTo(506, 174 - r); ctx.quadraticCurveTo(506, 174, 512 - r, 174);
    ctx.lineTo(r, 174); ctx.quadraticCurveTo(6, 174, 6, 174 - r);
    ctx.lineTo(6, r + 6); ctx.quadraticCurveTo(6, 6, r, 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#1d3557';
    ctx.font = 'bold 110px Arial';
    ctx.fillText(formatNumber(n), 256, 126);
  });
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex }));
  sprite.scale.set(2.2, 0.78, 1);
  return sprite;
}

/* ============================================================
   DUELOS (4 carriles)
   ============================================================ */
const LANE_Z = [-5.2, -2.1, 1, 4.1];
const lanes = [];
const laneHitMeshes = [];
const hitMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });

function buildLane(index, z){
  const g = new THREE.Group(); // se desplaza en el tira y afloja
  const elephant = buildElephant();
  elephant.position.set(-6.2, 0, 0);
  g.add(elephant);

  const lion = buildLion();
  lion.position.set(6.2, 0, 0);
  g.add(lion);

  const rope = new THREE.Mesh(
    new THREE.CylinderGeometry(0.07, 0.07, 9.6, 8),
    new THREE.MeshLambertMaterial({ color: 0x8d5a3a })
  );
  rope.rotation.z = Math.PI / 2;
  rope.position.set(0, 0.75, 0);
  g.add(rope);

  g.position.set(0, 0, z);
  scene.add(g);

  // pedestal central (fijo, no se mueve con el grupo)
  const pad = new THREE.Mesh(
    new THREE.CylinderGeometry(0.75, 0.82, 0.14, 18),
    new THREE.MeshLambertMaterial({ color: 0xffffff })
  );
  pad.position.set(0, 0.08, z);
  scene.add(pad);

  const qTex = canvasTexture(128, 128, ctx => {
    ctx.fillStyle = '#e76f51';
    ctx.textAlign = 'center';
    ctx.font = 'bold 100px Arial';
    ctx.fillText('?', 64, 100);
  });
  const qMark = new THREE.Sprite(new THREE.SpriteMaterial({ map: qTex, transparent: true }));
  qMark.scale.set(0.7, 0.7, 1);
  qMark.position.set(0, 1.1, z);
  scene.add(qMark);

  const hit = new THREE.Mesh(new THREE.BoxGeometry(2.7, 3.0, 2.9), hitMat);
  hit.position.set(0, 1.5, z);
  hit.userData.laneIndex = index;
  scene.add(hit);
  laneHitMeshes.push(hit);

  return { group: g, elephant, lion, rope, pad, qMark, z, answer: '', token: null, offset: 0, targetOffset: 0, leftNum: null, rightNum: null };
}

LANE_Z.forEach((z, i) => lanes.push(buildLane(i, z)));

/* ============================================================
   FICHAS DE SIGNOS
   ============================================================ */
const SIGN_WORDS = { '>': 'mayor que', '<': 'menor que', '=': 'igual que' };
let tokens = [];
const tokenHomes = [-3, -1, 1, 3].map(x => new THREE.Vector3(x, 0.85, 7.6));

function signTexture(sign){
  return canvasTexture(256, 256, ctx => {
    ctx.fillStyle = '#fffdf5';
    ctx.fillRect(0, 0, 256, 256);
    ctx.strokeStyle = '#2a9d8f';
    ctx.lineWidth = 16;
    ctx.strokeRect(8, 8, 240, 240);
    ctx.fillStyle = '#1d3557';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 170px Arial';
    ctx.fillText(sign, 128, 138);
  });
}

function buildToken(sign, idx){
  const tex = signTexture(sign);
  const sideMat = new THREE.MeshLambertMaterial({ color: 0x1d3557 });
  const faceMat = new THREE.MeshBasicMaterial({ map: tex });
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(1.15, 1.15, 0.22),
    [sideMat, sideMat, sideMat, sideMat, faceMat, faceMat]
  );
  const root = new THREE.Group();
  root.add(mesh);

  const hit = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.8, 1), hitMat);
  hit.position.y = 0.2;
  hit.userData.tokenIdx = idx;
  root.add(hit);

  root.position.copy(tokenHomes[idx]);
  scene.add(root);
  return { root, mesh, hit, sign, home: tokenHomes[idx].clone(), lane: null };
}

/* banco de fichas */
const bench = new THREE.Mesh(
  new THREE.BoxGeometry(9.5, 0.5, 1.6),
  new THREE.MeshLambertMaterial({ color: 0xb08968 })
);
bench.position.set(0, 0.25, 7.6);
bench.castShadow = bench.receiveShadow = true;
scene.add(bench);

/* ============================================================
   RONDA
   ============================================================ */
let held = null;
const tweens = [];

function tweenTo(group, target, dur, lift){
  tweens.push({ pos: group.position, from: group.position.clone(), to: target.clone(), t: 0, dur, lift: lift || 0 });
}

let celebrationT = -1;

function setupRound(){
  tokens.forEach(t => scene.remove(t.root));
  tokens = [];
  held = null;
  completed = false;
  celebrationT = -1;
  verifyBtn.disabled = false;
  nextBtn.disabled = true;
  feedback.className = 'hud-feedback';
  scoreEl.textContent = getScore();

  /* generar duelos como el juego original */
  const patterns = shuffle(['>', '<', '=', ['>', '<', '='][randomInt(0, 2)]]);

  patterns.forEach((sign, i) => {
    const lane = lanes[i];
    const left = randomInt(1000, 9999);
    let right;
    if(sign === '>'){
      right = Math.max(1000, left - randomInt(1, 500));
    } else if(sign === '<'){
      right = Math.min(9999, left + randomInt(1, 500));
    } else {
      right = left;
    }
    lane.answer = sign;
    lane.token = null;
    lane.offset = 0;
    lane.targetOffset = 0;
    lane.group.position.x = 0;
    lane.qMark.visible = true;

    if(lane.leftNum) scene.remove(lane.leftNum);
    if(lane.rightNum) scene.remove(lane.rightNum);
    lane.leftNum = numberSprite(left, '#8d99ae');
    lane.leftNum.position.set(-6.2, 2.5, lane.z);
    scene.add(lane.leftNum);
    lane.rightNum = numberSprite(right, '#e9b44c');
    lane.rightNum.position.set(6.2, 2.5, lane.z);
    scene.add(lane.rightNum);
  });

  /* fichas: los 4 signos de los duelos, desordenados */
  shuffle(patterns).forEach((sign, i) => {
    tokens.push(buildToken(sign, i));
  });

  goalEl.classList.remove('hidden');
}

/* ---------- Tomar / colocar ---------- */
function setHighlight(token, on){
  token.mesh.scale.setScalar(on ? 1.18 : 1);
}

function pickUp(token){
  if(held) setHighlight(held, false);
  if(held === token){
    dropAtHome(held);
    held = null;
    return;
  }
  held = token;
  setHighlight(token, true);
  const lift = token.root.position.clone();
  lift.y += 0.8;
  tweenTo(token.root, lift, 0.25);
  playClick();
  speak(SIGN_WORDS[token.sign]);
}

function dropAtHome(token){
  if(token.lane !== null){
    lanes[token.lane].token = null;
    lanes[token.lane].qMark.visible = true;
    token.lane = null;
  }
  setHighlight(token, false);
  tweenTo(token.root, token.home, 0.4, 1.2);
}

function placeInLane(token, laneIdx){
  const lane = lanes[laneIdx];
  if(lane.token && lane.token !== token){
    dropAtHome(lane.token);
  }
  if(token.lane !== null){
    lanes[token.lane].token = null;
    lanes[token.lane].qMark.visible = true;
  }
  lane.token = token;
  token.lane = laneIdx;
  lane.qMark.visible = false;
  setHighlight(token, false);
  held = null;
  tweenTo(token.root, new THREE.Vector3(0, 0.85, lane.z), 0.45, 1.4);
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
  const tokenHits = raycaster.intersectObjects(tokens.map(t => t.hit));
  const laneHits = raycaster.intersectObjects(laneHitMeshes);
  const token = tokenHits.length ? tokens[tokenHits[0].object.userData.tokenIdx] : null;
  const lane = laneHits.length ? laneHits[0].object.userData.laneIndex : null;
  if(token && lane !== null){
    // sin nada en la mano: prioridad a la ficha; con ficha tomada: al duelo
    return held ? { lane } : { token };
  }
  return { token, lane };
}

renderer.domElement.addEventListener('pointermove', e => {
  const { token, lane } = pick(e.clientX, e.clientY);
  renderer.domElement.style.cursor = (token || lane !== null) ? 'pointer' : 'default';
});

renderer.domElement.addEventListener('pointerup', e => {
  if(completed) return;
  const { token, lane } = pick(e.clientX, e.clientY);
  if(token){
    pickUp(token);
  } else if(lane !== null && held){
    placeInLane(held, lane);
  } else if(held){
    // clic en un espacio vacio: el signo vuelve al banco
    dropAtHome(held);
    held = null;
  }
});

/* ============================================================
   VERIFICACION Y TIRA Y AFLOJA
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

function verify(){
  if(completed) return;
  if(lanes.some(l => !l.token)){
    showFeedback('Coloca un signo en cada duelo primero.', 'bad');
    return;
  }
  if(held){ setHighlight(held, false); held = null; }

  /* animacion de tira y afloja segun la respuesta correcta */
  lanes.forEach(lane => {
    lane.targetOffset = lane.answer === '>' ? -1.6 : lane.answer === '<' ? 1.6 : 0;
  });
  celebrationT = 0;

  const ok = lanes.every(l => l.token.sign === l.answer);

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
    nextBtn.disabled = false;
    verifyBtn.disabled = true;
  } else {
    setScore(getScore() - 25);
    showFeedback('Inténtalo nuevamente. Se restaron 25 puntos.', 'bad');
  }
}

verifyBtn.addEventListener('click', verify);
restartBtn.addEventListener('click', setupRound);
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

  /* tira y afloja: primero forcejean, luego gana un lado */
  if(celebrationT >= 0){
    celebrationT += dt;
    lanes.forEach((lane, i) => {
      if(celebrationT < 1){
        // forcejeo
        lane.group.position.x = Math.sin(celebrationT * 25 + i) * 0.12;
        lane.group.rotation.z = Math.sin(celebrationT * 30 + i) * 0.008;
      } else {
        lane.offset += (lane.targetOffset - lane.offset) * Math.min(1, dt * 3);
        lane.group.position.x = lane.offset + Math.sin(time * 12 + i) * 0.02;
        lane.group.rotation.z = 0;
        // los animales se inclinan al tirar
        const lean = lane.targetOffset === 0 ? 0 : (lane.targetOffset < 0 ? -0.18 : 0.18);
        lane.elephant.rotation.z = -lean;
        lane.lion.rotation.z = -lean;
      }
    });
    if(celebrationT > 5){
      celebrationT = -1;
      lanes.forEach(lane => {
        lane.group.rotation.z = 0;
        lane.elephant.rotation.z = 0;
        lane.lion.rotation.z = 0;
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

  clouds.forEach(c => {
    c.position.x += c.userData.speed * dt;
    if(c.position.x > 35) c.position.x = -35;
  });

  camera.position.x = Math.sin(time * 0.22) * 0.3;
  camera.lookAt(0, 0, 0.8);

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

speak('Toca un signo y luego toca el círculo del duelo. Compara los números de cada equipo con mayor que, menor que, o igual.');
setTimeout(() => goalEl.classList.add('hidden'), 14000);

})();
