/* ============================================================
   EducaRZ - Carrera de kilometros 3D (Juego 2, 4 Basico)
   Autopista: toma los autos y ordenalos en la carretera
   desde el que recorrio menos km hasta el que recorrio mas.
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

const GAME_NUMBER = 2;
const NEXT_URL = 'cuarto-basico-3d.html?viaje=3';

if(!window.THREE){
  window.location.href = 'juego-recta.html';
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
const ambient = new Audio('sonidos/carretera.mp3');
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

/* ============================================================
   ESCENA
   ============================================================ */
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x8fd3f4);
scene.fog = new THREE.Fog(0x8fd3f4, 50, 120);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(0, 8.2, 11.5);
camera.lookAt(0, 1.2, 0.5);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
container.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xcfeefc, 0x7ec850, 0.9));
const sunLight = new THREE.DirectionalLight(0xfff3d6, 0.95);
sunLight.position.set(10, 18, 10);
sunLight.castShadow = true;
sunLight.shadow.mapSize.set(1024, 1024);
sunLight.shadow.camera.left = -16;
sunLight.shadow.camera.right = 16;
sunLight.shadow.camera.top = 16;
sunLight.shadow.camera.bottom = -16;
scene.add(sunLight);

/* ---------- Texturas ---------- */
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
  new THREE.PlaneGeometry(80, 50),
  new THREE.MeshLambertMaterial({ color: 0x7ec850 })
);
ground.rotation.x = -Math.PI / 2;
ground.position.z = 2;
ground.receiveShadow = true;
scene.add(ground);

/* Cerros lejanos */
const hillMat = new THREE.MeshLambertMaterial({ color: 0x6aa84f });
const hillMat2 = new THREE.MeshLambertMaterial({ color: 0x93c47d });
[[-22, -16, 9, 22], [0, -20, 12, 30], [21, -15, 8, 20], [-32, -8, 7, 16], [33, -6, 9, 18]].forEach(([x, z, h, w], i) => {
  const hill = new THREE.Mesh(new THREE.ConeGeometry(w / 2, h, 8), i % 2 ? hillMat : hillMat2);
  hill.position.set(x, h / 2 - 0.5, z);
  scene.add(hill);
});

/* Arboles */
const trunkMat = new THREE.MeshLambertMaterial({ color: 0x8d5a3a });
const leafMats = [0x2a9d4f, 0x4caf50, 0x357a38].map(c => new THREE.MeshLambertMaterial({ color: c }));
[[-12, -3], [-8.5, -5], [-14, 1], [9, -4], [13, -2], [12, 1.5], [-11, 6.5], [11.5, 7], [-15, 8], [15, 8.5]].forEach(([x, z], i) => {
  const s = 0.8 + (i % 3) * 0.25;
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

/* Nubes */
const cloudMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
const clouds = [];
for(let i = 0; i < 5; i++){
  const cloud = new THREE.Group();
  const k = 0.8 + Math.random();
  [[0,0,0,1.2],[1,0.15,0.2,0.85],[-1,0.1,-0.15,0.9]].forEach(([x,y,z,s]) => {
    const puff = new THREE.Mesh(new THREE.SphereGeometry(s * k, 10, 8), cloudMat);
    puff.position.set(x * k, y * k, z * k);
    cloud.add(puff);
  });
  cloud.position.set(-30 + Math.random() * 60, 10 + Math.random() * 5, -14 + Math.random() * 10);
  cloud.userData.speed = 0.4 + Math.random();
  clouds.push(cloud);
  scene.add(cloud);
}

/* ---------- Carretera (zona de respuesta) ---------- */
const ROAD_Z = 2.6;
const road = new THREE.Mesh(
  new THREE.BoxGeometry(26, 0.12, 4.2),
  new THREE.MeshLambertMaterial({ color: 0x4a4e57 })
);
road.position.set(0, 0.06, ROAD_Z);
road.receiveShadow = true;
scene.add(road);

/* lineas laterales y demarcacion de espacios */
const lineMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
[-1.95, 1.95].forEach(dz => {
  const line = new THREE.Mesh(new THREE.BoxGeometry(26, 0.13, 0.12), lineMat);
  line.position.set(0, 0.07, ROAD_Z + dz);
  scene.add(line);
});

/* flecha de sentido sobre el costado de la carretera */
const arrowTex = canvasTexture(1024, 128, ctx => {
  ctx.fillStyle = '#ffb703';
  ctx.font = 'bold 76px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('MENOS km  ➜  ➜  ➜  MÁS km', 512, 64);
});
const arrow = new THREE.Mesh(
  new THREE.PlaneGeometry(13, 1.6),
  new THREE.MeshBasicMaterial({ map: arrowTex, transparent: true })
);
arrow.rotation.x = -Math.PI / 2;
arrow.position.set(0, 0.14, ROAD_Z + 3);
scene.add(arrow);

/* ---------- Espacios numerados ---------- */
function slotNumberPlane(index){
  const tex = canvasTexture(256, 256, ctx => {
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(128, 100, 78, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1d3557';
    ctx.textAlign = 'center';
    ctx.font = 'bold 120px Arial';
    ctx.fillText(String(index + 1), 128, 142);
    if(index === 0 || index === 5){
      ctx.fillStyle = index === 0 ? '#80ffdb' : '#ffb703';
      ctx.font = 'bold 52px Arial';
      ctx.fillText(index === 0 ? 'MENOR' : 'MAYOR', 128, 238);
    }
  });
  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(1.25, 1.25),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true })
  );
  plane.rotation.x = -Math.PI / 2;
  return plane;
}

const slots = [];
const slotHitMeshes = [];
const hitMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
const slotMarkMat = new THREE.MeshLambertMaterial({ color: 0xffffff });

for(let i = 0; i < 6; i++){
  const x = -10 + i * 4;

  // marco del espacio de estacionamiento
  [[0, -1.4, 3.4, 0.14], [0, 1.4, 3.4, 0.14], [-1.7, 0, 0.14, 2.94], [1.7, 0, 0.14, 2.94]].forEach(([dx, dz, w, d]) => {
    const seg = new THREE.Mesh(new THREE.BoxGeometry(w, 0.13, d), slotMarkMat);
    seg.position.set(x + dx, 0.08, ROAD_Z + dz);
    scene.add(seg);
  });

  // numero pintado en el asfalto, al frente del espacio
  const label = slotNumberPlane(i);
  label.position.set(x, 0.145, ROAD_Z + 1.05);
  scene.add(label);

  const hit = new THREE.Mesh(new THREE.BoxGeometry(3.95, 3.2, 3.9), hitMat);
  hit.position.set(x, 1.5, ROAD_Z);
  hit.userData.slotIndex = i;
  scene.add(hit);
  slotHitMeshes.push(hit);

  slots.push({ x, z: ROAD_Z, car: null });
}

/* ---------- Zona de partida (autos desordenados) ---------- */
const startPad = new THREE.Mesh(
  new THREE.BoxGeometry(26, 0.1, 3.6),
  new THREE.MeshLambertMaterial({ color: 0xc9b79c })
);
startPad.position.set(0, 0.05, -3.2);
startPad.receiveShadow = true;
scene.add(startPad);

/* ============================================================
   AUTOS
   ============================================================ */
const CAR_COLORS = [0xe63946, 0x457b9d, 0x2a9d8f, 0x8338ec, 0xff6b35, 0xffb703];

function lam(color){ return new THREE.MeshLambertMaterial({ color }); }

function buildCar(color){
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.55, 1.1), lam(color));
  body.position.y = 0.55;
  body.castShadow = true;
  g.add(body);
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.5, 0.95), lam(0xbde0fe));
  cabin.position.set(-0.15, 1.05, 0);
  cabin.castShadow = true;
  g.add(cabin);
  const wheelGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.2, 12);
  [[-0.7, 0.62], [0.7, 0.62], [-0.7, -0.62], [0.7, -0.62]].forEach(([wx, wz]) => {
    const wheel = new THREE.Mesh(wheelGeo, lam(0x2b2d42));
    wheel.rotation.x = Math.PI / 2;
    wheel.position.set(wx, 0.28, wz);
    g.add(wheel);
  });
  const lightGeo = new THREE.BoxGeometry(0.1, 0.16, 0.2);
  [[1.06, 0.32], [1.06, -0.32]].forEach(([lx, lz]) => {
    const light = new THREE.Mesh(lightGeo, lam(0xfff3b0));
    light.position.set(lx, 0.6, lz);
    g.add(light);
  });
  return g;
}

function kmTagSprite(km){
  const tex = canvasTexture(512, 200, ctx => {
    ctx.fillStyle = 'rgba(255,255,255,0.97)';
    ctx.strokeStyle = '#1d3557';
    ctx.lineWidth = 12;
    const r = 30;
    ctx.beginPath();
    ctx.moveTo(r, 6);
    ctx.lineTo(512 - r, 6); ctx.quadraticCurveTo(506, 6, 506, r + 6);
    ctx.lineTo(506, 194 - r); ctx.quadraticCurveTo(506, 194, 512 - r, 194);
    ctx.lineTo(r, 194); ctx.quadraticCurveTo(6, 194, 6, 194 - r);
    ctx.lineTo(6, r + 6); ctx.quadraticCurveTo(6, 6, r, 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#e63946';
    ctx.font = 'bold 104px Arial';
    ctx.fillText(formatNumber(km) + ' km', 256, 138);
  });
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex }));
  sprite.scale.set(2.1, 0.82, 1);
  return sprite;
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

let cars = [];
let held = null;
const tweens = [];

function tweenTo(group, target, dur, lift){
  tweens.push({ pos: group.position, from: group.position.clone(), to: target.clone(), t: 0, dur, lift: lift || 0 });
}

function clearCars(){
  cars.forEach(c => scene.remove(c.root));
  cars = [];
  held = null;
  slots.forEach(s => { s.car = null; });
}

function setupRound(){
  clearCars();
  completed = false;
  verifyBtn.disabled = false;
  nextBtn.disabled = true;
  feedback.className = 'hud-feedback';
  scoreEl.textContent = getScore();

  const kms = uniqueRandomNumbers(6, 1000, 9999, 25).sort((a, b) => a - b);
  const order = shuffle([0, 1, 2, 3, 4, 5]);

  kms.forEach((km, i) => {
    const root = new THREE.Group();
    const model = buildCar(CAR_COLORS[i % CAR_COLORS.length]);
    root.add(model);

    const tag = kmTagSprite(km);
    tag.position.y = 2.1;
    root.add(tag);

    const hit = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.6, 1.6), hitMat);
    hit.position.y = 1.1;
    hit.userData.carIdx = i;
    root.add(hit);

    const home = new THREE.Vector3(-10 + order[i] * 4, 0.06, -3.2);
    root.position.copy(home);
    scene.add(root);

    cars.push({ root, model, hit, km, home, slot: null });
  });

  goalEl.classList.remove('hidden');
}

/* ---------- Tomar / soltar ---------- */
function setHighlight(car, on){
  car.model.traverse(o => {
    if(o.isMesh && o.material && o.material.emissive){
      o.material = o.material.clone();
      o.material.emissive.setHex(on ? 0x554400 : 0x000000);
    }
  });
  car.model.scale.setScalar(on ? 1.12 : 1);
}

function pickUp(car){
  if(held) setHighlight(held, false);
  if(held === car){
    dropAtHome(held);
    held = null;
    return;
  }
  held = car;
  setHighlight(car, true);
  const lift = car.root.position.clone();
  lift.y += 0.8;
  tweenTo(car.root, lift, 0.25);
  playClick();
  speak(formatNumber(car.km) + ' kilómetros');
}

function dropAtHome(car){
  if(car.slot !== null){ slots[car.slot].car = null; car.slot = null; }
  setHighlight(car, false);
  tweenTo(car.root, car.home, 0.4, 1.2);
}

function placeInSlot(car, slotIdx){
  const slot = slots[slotIdx];
  if(slot.car && slot.car !== car){
    dropAtHome(slot.car);
  }
  if(car.slot !== null) slots[car.slot].car = null;
  slot.car = car;
  car.slot = slotIdx;
  setHighlight(car, false);
  held = null;
  tweenTo(car.root, new THREE.Vector3(slot.x, 0.13, slot.z), 0.45, 1.5);
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
  const carHits = raycaster.intersectObjects(cars.map(c => c.hit));
  const slotHits = raycaster.intersectObjects(slotHitMeshes);
  const car = carHits.length ? cars[carHits[0].object.userData.carIdx] : null;
  const slot = slotHits.length ? slotHits[0].object.userData.slotIndex : null;
  if(car && slot !== null){
    // sin nada en la mano: prioridad al auto; con auto tomado: al espacio
    return held ? { slot } : { car };
  }
  return { car, slot };
}

renderer.domElement.addEventListener('pointermove', e => {
  const { car, slot } = pick(e.clientX, e.clientY);
  renderer.domElement.style.cursor = (car || slot !== null) ? 'pointer' : 'default';
});

renderer.domElement.addEventListener('pointerup', e => {
  if(completed) return;
  const { car, slot } = pick(e.clientX, e.clientY);
  if(car){
    pickUp(car);
  } else if(slot !== null && held){
    placeInSlot(held, slot);
  } else if(held){
    // clic en un espacio vacio: el auto vuelve a su lugar
    dropAtHome(held);
    held = null;
  }
});

/* ============================================================
   VERIFICACION
   ============================================================ */
const PRAISES = ['¡Muy bien!', '¡Excelente trabajo!', '¡Lo lograste!', '¡Eres increíble!'];

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
    p.position.set((Math.random() - 0.5) * 16, 7 + Math.random() * 3, Math.random() * 5);
    p.userData.vy = -(1.5 + Math.random() * 2);
    p.userData.rx = Math.random() * 4;
    p.userData.rz = Math.random() * 4;
  });
}

let raceTime = -1; // animacion de victoria: los autos avanzan

function verify(){
  if(completed) return;
  if(slots.some(s => !s.car)){
    showFeedback('Coloca los 6 autos en la carretera primero.', 'bad');
    return;
  }
  if(held){ setHighlight(held, false); held = null; }

  const ok = slots.every((s, i) => i === 0 || slots[i - 1].car.km < s.car.km);

  if(ok){
    completed = true;
    const gained = 100 + GAME_NUMBER * 15;
    setScore(getScore() + gained);
    setUnlocked(GAME_NUMBER + 1);
    const praise = PRAISES[Math.floor(Math.random() * PRAISES.length)];
    showFeedback(praise + ' Ganaste ' + gained + ' puntos.', 'good');
    try { winSound.currentTime = 0; winSound.play(); } catch(e){}
    launchConfetti();
    raceTime = 0; // ¡los autos arrancan!
    nextBtn.disabled = false;
    verifyBtn.disabled = true;
  } else {
    setScore(getScore() - 25);
    showFeedback('Inténtalo nuevamente. Se restaron 25 puntos.', 'bad');
  }
}

verifyBtn.addEventListener('click', verify);
restartBtn.addEventListener('click', () => { raceTime = -1; setupRound(); });
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

  /* celebracion: los autos avanzan por la carretera */
  if(raceTime >= 0){
    raceTime += dt;
    cars.forEach(c => {
      if(c.slot === null) return;
      c.root.position.x += dt * (3 + c.slot * 0.4);
      if(c.root.position.x > 18) c.root.position.x = -18;
      c.root.children[0].rotation.z = Math.sin(time * 18) * 0.02;
    });
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

  camera.position.x = Math.sin(time * 0.25) * 0.35;
  camera.lookAt(0, 1.2, 0.5);

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

speak('Toca un auto para tomarlo y luego toca un espacio de la carretera. Ordena desde el que recorrió menos kilómetros hasta el que recorrió más.');
setTimeout(() => goalEl.classList.add('hidden'), 14000);

})();
