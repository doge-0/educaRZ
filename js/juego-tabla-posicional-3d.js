/* ============================================================
   EducaRZ - Reloj de memoria 3D (Juego 3, 4 Basico)
   Plaza nocturna: memoriza la hora de la torre del reloj y
   escribela con el teclado numerico 3D.
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

const GAME_NUMBER = 3;
const NEXT_URL = 'cuarto-basico-3d.html?viaje=4';

if(!window.THREE){
  window.location.href = 'juego-tabla-posicional.html';
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
const ambient = new Audio('sonidos/reloj.mp3');
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

/* ============================================================
   ESCENA (plaza de noche)
   ============================================================ */
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1b3a);
scene.fog = new THREE.Fog(0x1a1b3a, 40, 90);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(0, 7.2, 15.5);
camera.lookAt(0, 2.9, 1);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
container.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0x9aa0e0, 0x33473a, 0.75));
const moonLight = new THREE.DirectionalLight(0xcfd8ff, 0.7);
moonLight.position.set(-10, 16, 8);
moonLight.castShadow = true;
moonLight.shadow.mapSize.set(1024, 1024);
moonLight.shadow.camera.left = -15;
moonLight.shadow.camera.right = 15;
moonLight.shadow.camera.top = 15;
moonLight.shadow.camera.bottom = -15;
scene.add(moonLight);

/* ---------- Texturas ---------- */
function canvasTexture(w, h, draw){
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'));
  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 4;
  return tex;
}

/* ---------- Cielo ---------- */
const starGeo = new THREE.BufferGeometry();
{
  const positions = [];
  for(let i = 0; i < 220; i++){
    const a = Math.random() * Math.PI * 2;
    const r = 35 + Math.random() * 40;
    const y = 6 + Math.random() * 38;
    positions.push(Math.cos(a) * r, y, Math.sin(a) * r - 10);
  }
  starGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
}
const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xfffbe6, size: 0.3 }));
scene.add(stars);

const moon = new THREE.Mesh(
  new THREE.SphereGeometry(2.2, 16, 16),
  new THREE.MeshBasicMaterial({ color: 0xfff3c4 })
);
moon.position.set(-16, 18, -24);
scene.add(moon);

/* ---------- Suelo y plaza ---------- */
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(80, 60),
  new THREE.MeshLambertMaterial({ color: 0x2e4a33 })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

const plaza = new THREE.Mesh(
  new THREE.CylinderGeometry(9, 9, 0.18, 32),
  new THREE.MeshLambertMaterial({ color: 0x6d6875 })
);
plaza.position.y = 0.09;
plaza.receiveShadow = true;
scene.add(plaza);

/* faroles */
function lamppost(x, z){
  const g = new THREE.Group();
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.09, 0.13, 3.4, 8),
    new THREE.MeshLambertMaterial({ color: 0x3d405b })
  );
  pole.position.y = 1.7;
  pole.castShadow = true;
  g.add(pole);
  const bulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.32, 10, 8),
    new THREE.MeshBasicMaterial({ color: 0xffd97d })
  );
  bulb.position.y = 3.55;
  g.add(bulb);
  const light = new THREE.PointLight(0xffd97d, 0.55, 9);
  light.position.y = 3.5;
  g.add(light);
  g.position.set(x, 0, z);
  scene.add(g);
}
lamppost(-7, 2.5);
lamppost(7, 2.5);

/* arboles nocturnos */
const trunkMat = new THREE.MeshLambertMaterial({ color: 0x5e4632 });
const leafMat = new THREE.MeshLambertMaterial({ color: 0x1d6b45 });
[[-11, -3], [11, -3], [-13, 4], [13, 4], [-9, 7], [9, 7]].forEach(([x, z], i) => {
  const s = 0.9 + (i % 3) * 0.3;
  const tree = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2 * s, 0.28 * s, 1.4 * s, 6), trunkMat);
  trunk.position.y = 0.7 * s;
  trunk.castShadow = true;
  const leaves = new THREE.Mesh(new THREE.ConeGeometry(1.1 * s, 2.6 * s, 7), leafMat);
  leaves.position.y = 2.4 * s;
  leaves.castShadow = true;
  tree.add(trunk, leaves);
  tree.position.set(x, 0, z);
  scene.add(tree);
});

/* ============================================================
   TORRE DEL RELOJ
   ============================================================ */
const tower = new THREE.Group();

const towerBody = new THREE.Mesh(
  new THREE.BoxGeometry(3.4, 7.5, 3.4),
  new THREE.MeshLambertMaterial({ color: 0x8338ec })
);
towerBody.position.y = 3.75;
towerBody.castShadow = true;
tower.add(towerBody);

const towerBase = new THREE.Mesh(
  new THREE.BoxGeometry(4.2, 1, 4.2),
  new THREE.MeshLambertMaterial({ color: 0x5a189a })
);
towerBase.position.y = 0.5;
tower.add(towerBase);

const towerRoof = new THREE.Mesh(
  new THREE.ConeGeometry(2.9, 2, 4),
  new THREE.MeshLambertMaterial({ color: 0x5a189a })
);
towerRoof.position.y = 8.5;
towerRoof.rotation.y = Math.PI / 4;
towerRoof.castShadow = true;
tower.add(towerRoof);

/* marco de la pantalla (parpadea al ganar) */
const frameMat = new THREE.MeshLambertMaterial({ color: 0xffb703, emissive: 0x000000 });
const screenFrame = new THREE.Mesh(new THREE.BoxGeometry(3.8, 2.2, 0.25), frameMat);
screenFrame.position.set(0, 5.6, 1.72);
tower.add(screenFrame);

/* pantalla del reloj (textura dinamica) */
const clockCanvas = document.createElement('canvas');
clockCanvas.width = 512;
clockCanvas.height = 256;
const clockCtx = clockCanvas.getContext('2d');
const clockTex = new THREE.CanvasTexture(clockCanvas);

function drawClock(text, sub){
  clockCtx.fillStyle = '#10122b';
  clockCtx.fillRect(0, 0, 512, 256);
  clockCtx.textAlign = 'center';
  clockCtx.fillStyle = '#4dffdf';
  clockCtx.font = 'bold 150px monospace';
  clockCtx.fillText(text, 256, 165);
  if(sub){
    clockCtx.fillStyle = '#ffd97d';
    clockCtx.font = 'bold 30px Arial';
    clockCtx.fillText(sub, 256, 230);
  }
  clockTex.needsUpdate = true;
}

const clockScreen = new THREE.Mesh(
  new THREE.PlaneGeometry(3.4, 1.8),
  new THREE.MeshBasicMaterial({ map: clockTex })
);
clockScreen.position.set(0, 5.6, 1.86);
tower.add(clockScreen);

/* ventanitas */
[[0, 2.2], [0, 3.4]].forEach(([x, y]) => {
  const win = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 0.7, 0.1),
    new THREE.MeshBasicMaterial({ color: 0xffd97d })
  );
  win.position.set(x, y, 1.72);
  tower.add(win);
});

tower.position.set(0, 0, -2);
scene.add(tower);

/* ============================================================
   PODIO CON PANTALLA DE RESPUESTA Y TECLADO 3D
   ============================================================ */
const podium = new THREE.Group();

const podiumBody = new THREE.Mesh(
  new THREE.BoxGeometry(5.6, 1.1, 3.4),
  new THREE.MeshLambertMaterial({ color: 0x3d405b })
);
podiumBody.position.y = 0.55;
podiumBody.castShadow = true;
podium.add(podiumBody);

/* pantalla de respuesta */
const answerCanvas = document.createElement('canvas');
answerCanvas.width = 512;
answerCanvas.height = 160;
const answerCtx = answerCanvas.getContext('2d');
const answerTex = new THREE.CanvasTexture(answerCanvas);

function drawAnswer(digits){
  answerCtx.fillStyle = '#10122b';
  answerCtx.fillRect(0, 0, 512, 160);
  const shown = [];
  for(let i = 0; i < 4; i++) shown.push(digits[i] !== undefined ? digits[i] : '_');
  const text = shown[0] + shown[1] + ':' + shown[2] + shown[3];
  answerCtx.textAlign = 'center';
  answerCtx.fillStyle = '#ffd97d';
  answerCtx.font = 'bold 110px monospace';
  answerCtx.fillText(text, 256, 118);
  answerTex.needsUpdate = true;
}

/* la pantalla va elevada detras del teclado, sobre un soporte */
const answerFrame = new THREE.Mesh(
  new THREE.BoxGeometry(3.5, 1.25, 0.14),
  new THREE.MeshLambertMaterial({ color: 0x8338ec })
);
answerFrame.position.set(0, 2.65, -0.85);
answerFrame.rotation.x = -0.3;
podium.add(answerFrame);

const answerScreen = new THREE.Mesh(
  new THREE.PlaneGeometry(3.2, 1),
  new THREE.MeshBasicMaterial({ map: answerTex })
);
answerScreen.position.set(0, 2.66, -0.76);
answerScreen.rotation.x = -0.3;
podium.add(answerScreen);

const screenSupport = new THREE.Mesh(
  new THREE.BoxGeometry(0.3, 1.5, 0.14),
  new THREE.MeshLambertMaterial({ color: 0x2b2d42 })
);
screenSupport.position.set(0, 1.75, -1);
podium.add(screenSupport);

/* teclado */
const KEYS = [['1','2','3'], ['4','5','6'], ['7','8','9'], ['⌫','0','✔']];
const keyMeshes = [];
let keypadEnabled = false;

function keyTexture(label, bgColor){
  return canvasTexture(128, 128, ctx => {
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, 128, 128);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 78px Arial';
    ctx.fillText(label, 64, 70);
  });
}

/* consola inclinada: tablero con teclas planas encima */
const keyboard = new THREE.Group();

const keyBoardBase = new THREE.Mesh(
  new THREE.BoxGeometry(3.3, 0.16, 4),
  new THREE.MeshLambertMaterial({ color: 0x2b2d42 })
);
keyboard.add(keyBoardBase);

KEYS.forEach((row, r) => {
  row.forEach((label, c) => {
    const bg = label === '⌫' ? '#e63946' : label === '✔' ? '#2a9d8f' : '#457b9d';
    const sideMat = new THREE.MeshLambertMaterial({ color: 0x1d2033 });
    const key = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.22, 0.8),
      [sideMat, sideMat, new THREE.MeshBasicMaterial({ map: keyTexture(label, bg) }), sideMat, sideMat, sideMat]
    );
    // fila 0 (1 2 3) atras, fila 3 (borrar 0 listo) adelante
    key.position.set((c - 1) * 0.98, 0.16, (r - 1.5) * 0.94);
    key.userData.key = label;
    key.castShadow = true;
    keyboard.add(key);
    keyMeshes.push(key);
  });
});

keyboard.position.set(0, 1.32, 0.5);
keyboard.rotation.x = 0.5; // inclinada hacia el jugador
podium.add(keyboard);

podium.position.set(0, 0, 5);
scene.add(podium);

/* ============================================================
   LOGICA DEL JUEGO
   ============================================================ */
function randomInt(min, max){
  return min + Math.floor(Math.random() * (max - min + 1));
}

let memoryAnswer = '';
let typed = [];
let countdownTimer = null;
let phase = 'show'; // show | input | done

function setupRound(){
  clearInterval(countdownTimer);
  completed = false;
  phase = 'show';
  keypadEnabled = false;
  typed = [];
  verifyBtn.disabled = true;
  nextBtn.disabled = true;
  feedback.className = 'hud-feedback';
  scoreEl.textContent = getScore();
  drawAnswer(typed);

  const hour = randomInt(12, 23);
  const minute = randomInt(0, 59);
  const minuteText = String(minute).padStart(2, '0');
  const display = hour + ':' + minuteText;
  memoryAnswer = String(hour) + minuteText;

  let seconds = 3;
  drawClock(display, 'Memoriza: ' + seconds);
  speak('Memoriza la hora');

  countdownTimer = setInterval(() => {
    seconds--;
    if(seconds > 0){
      drawClock(display, 'Memoriza: ' + seconds);
    } else {
      clearInterval(countdownTimer);
      drawClock('??:??', 'Escribe la hora');
      phase = 'input';
      keypadEnabled = true;
      verifyBtn.disabled = false;
      speak('¿Qué hora era? Escríbela con el teclado');
    }
  }, 1000);

  goalEl.classList.remove('hidden');
}

function pressKey(label){
  if(!keypadEnabled || completed) return;
  playClick();
  if(label === '⌫'){
    typed.pop();
  } else if(label === '✔'){
    verify();
    return;
  } else if(typed.length < 4){
    typed.push(label);
    speak(label);
  }
  drawAnswer(typed);
}

function verify(){
  if(completed || phase !== 'input') return;
  if(typed.length < 4){
    showFeedback('Escribe los 4 dígitos de la hora primero.', 'bad');
    return;
  }

  const ok = typed.join('') === memoryAnswer;

  if(ok){
    completed = true;
    phase = 'done';
    keypadEnabled = false;
    const gained = 100 + GAME_NUMBER * 15;
    setScore(getScore() + gained);
    setUnlocked(GAME_NUMBER + 1);
    const PRAISES = ['¡Muy bien!', '¡Excelente memoria!', '¡Lo lograste!', '¡Eres increíble!'];
    const praise = PRAISES[Math.floor(Math.random() * PRAISES.length)];
    showFeedback(praise + ' Ganaste ' + gained + ' puntos.', 'good');
    drawClock(memoryAnswer.slice(0, 2) + ':' + memoryAnswer.slice(2), '¡Correcto!');
    try { winSound.currentTime = 0; winSound.play(); } catch(e){}
    launchConfetti();
    celebrationT = 0;
    nextBtn.disabled = false;
    verifyBtn.disabled = true;
  } else {
    setScore(getScore() - 25);
    showFeedback('Inténtalo nuevamente. Se restaron 25 puntos.', 'bad');
    typed = [];
    drawAnswer(typed);
  }
}

/* ============================================================
   INTERACCION
   ============================================================ */
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

function pickKey(clientX, clientY){
  pointer.x = (clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(keyMeshes);
  return hits.length ? hits[0].object : null;
}

renderer.domElement.addEventListener('pointermove', e => {
  const key = pickKey(e.clientX, e.clientY);
  renderer.domElement.style.cursor = (key && keypadEnabled) ? 'pointer' : 'default';
});

renderer.domElement.addEventListener('pointerup', e => {
  const key = pickKey(e.clientX, e.clientY);
  if(!key) return;
  // animacion de presion
  key.scale.setScalar(0.86);
  setTimeout(() => key.scale.setScalar(1), 130);
  pressKey(key.userData.key);
});

/* teclado fisico tambien funciona */
window.addEventListener('keydown', e => {
  if(e.key >= '0' && e.key <= '9') pressKey(e.key);
  else if(e.key === 'Backspace') pressKey('⌫');
  else if(e.key === 'Enter') pressKey('✔');
});

/* ============================================================
   CELEBRACION
   ============================================================ */
const confetti = [];
const confettiCols = [0xe63946, 0xffb703, 0x2a9d8f, 0x8338ec, 0x457b9d];
for(let i = 0; i < 60; i++){
  const piece = new THREE.Mesh(
    new THREE.PlaneGeometry(0.2, 0.2),
    new THREE.MeshBasicMaterial({ color: confettiCols[i % 5], side: THREE.DoubleSide })
  );
  piece.visible = false;
  confetti.push(piece);
  scene.add(piece);
}

function launchConfetti(){
  confetti.forEach(p => {
    p.visible = true;
    p.position.set((Math.random() - 0.5) * 12, 8 + Math.random() * 3, Math.random() * 6 - 1);
    p.userData.vy = -(1.5 + Math.random() * 2);
    p.userData.rx = Math.random() * 4;
    p.userData.rz = Math.random() * 4;
  });
}

let celebrationT = -1;

/* ---------- Botones HUD ---------- */
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

  /* parpadeo del marco al ganar */
  if(celebrationT >= 0){
    celebrationT += dt;
    const blink = Math.sin(celebrationT * 10) > 0;
    frameMat.emissive.setHex(blink ? 0xbb6700 : 0x000000);
    tower.rotation.z = Math.sin(celebrationT * 6) * 0.012;
    if(celebrationT > 6){
      celebrationT = -1;
      frameMat.emissive.setHex(0x000000);
      tower.rotation.z = 0;
    }
  }

  confetti.forEach(p => {
    if(!p.visible) return;
    p.position.y += p.userData.vy * dt;
    p.rotation.x += p.userData.rx * dt;
    p.rotation.z += p.userData.rz * dt;
    if(p.position.y < 0.05) p.visible = false;
  });

  /* estrellas titilan y la luna flota */
  stars.material.size = 0.3 + Math.sin(time * 2) * 0.06;
  moon.position.y = 18 + Math.sin(time * 0.4) * 0.4;

  camera.position.x = Math.sin(time * 0.22) * 0.3;
  camera.lookAt(0, 2.9, 1);

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

speak('Mira la hora del reloj durante tres segundos. Cuando desaparezca, escríbela con el teclado numérico.');
setTimeout(() => goalEl.classList.add('hidden'), 14000);

})();
