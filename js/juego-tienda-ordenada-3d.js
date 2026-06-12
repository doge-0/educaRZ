/* ============================================================
   EducaRZ - Tienda ordenada 3D (Juego 1, 4 Basico)
   Escena de supermercado: toma productos y ordenalos por
   precio de menor a mayor en las repisas numeradas.
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

const GAME_NUMBER = 1;
const NEXT_URL = 'cuarto-basico-3d.html?viaje=2';

if(!window.THREE){
  window.location.href = 'juego-tienda-ordenada.html';
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

function showFeedback(text, kind){
  feedback.textContent = text;
  feedback.className = 'hud-feedback ' + kind;
  speak(text);
  clearTimeout(feedbackTimer);
  if(kind === 'bad') feedbackTimer = setTimeout(() => { feedback.className = 'hud-feedback'; }, 4000);
}

/* ---------- Sonido y voz ---------- */
const ambient = new Audio('sonidos/supermercado.mp3');
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

function speak(text){
  if(typeof speechSynthesis === 'undefined') return;
  speechSynthesis.cancel();
  const voice = new SpeechSynthesisUtterance(text);
  voice.lang = 'es-ES';
  voice.rate = 0.92;
  speechSynthesis.speak(voice);
}

function formatNumber(n){
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/* ============================================================
   ESCENA
   ============================================================ */
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xfff3e0);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 7.2, 10.8);
camera.lookAt(0, 1.9, 0.4);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
container.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xfff6e6, 0xd9c8a9, 0.9));
const lamp = new THREE.DirectionalLight(0xfff1d0, 0.85);
lamp.position.set(6, 12, 8);
lamp.castShadow = true;
lamp.shadow.mapSize.set(1024, 1024);
lamp.shadow.camera.left = -12;
lamp.shadow.camera.right = 12;
lamp.shadow.camera.top = 12;
lamp.shadow.camera.bottom = -12;
scene.add(lamp);

/* ---------- Texturas de canvas ---------- */
function canvasTexture(w, h, draw){
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'));
  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 4;
  return tex;
}

const floorTex = canvasTexture(512, 512, ctx => {
  const colors = ['#fdf6ec', '#f3e3cf'];
  const s = 64;
  for(let y = 0; y < 8; y++) for(let x = 0; x < 8; x++){
    ctx.fillStyle = colors[(x + y) % 2];
    ctx.fillRect(x * s, y * s, s, s);
  }
});
floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping;
floorTex.repeat.set(3, 2);

const bannerTex = canvasTexture(1024, 256, ctx => {
  ctx.fillStyle = '#e76f51';
  ctx.fillRect(0, 0, 1024, 256);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 110px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🏪 MINI TIENDA', 512, 128);
});

/* ---------- Local ---------- */
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(44, 32),
  new THREE.MeshLambertMaterial({ map: floorTex })
);
floor.rotation.x = -Math.PI / 2;
floor.position.z = 4;
floor.receiveShadow = true;
scene.add(floor);

const backWall = new THREE.Mesh(
  new THREE.BoxGeometry(26, 7, 0.4),
  new THREE.MeshLambertMaterial({ color: 0xffe8c2 })
);
backWall.position.set(0, 3.5, -5);
scene.add(backWall);

[-13, 13].forEach(x => {
  const side = new THREE.Mesh(
    new THREE.BoxGeometry(0.4, 7, 14),
    new THREE.MeshLambertMaterial({ color: 0xf6dcb1 })
  );
  side.position.set(x, 3.5, 2);
  scene.add(side);
});

const banner = new THREE.Mesh(
  new THREE.PlaneGeometry(9, 2.2),
  new THREE.MeshBasicMaterial({ map: bannerTex })
);
banner.position.set(0, 5.4, -4.78);
scene.add(banner);

/* Estanterias de fondo con mercaderia */
function buildShelf(x){
  const g = new THREE.Group();
  // panel trasero delgado (la mercaderia va DELANTE, visible)
  const back = new THREE.Mesh(
    new THREE.BoxGeometry(4.2, 4.4, 0.25),
    new THREE.MeshLambertMaterial({ color: 0x8d5a3a })
  );
  back.position.set(0, 2.2, -0.4);
  back.castShadow = true;
  g.add(back);
  [-2.05, 2.05].forEach(sx => {
    const post = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 4.4, 1),
      new THREE.MeshLambertMaterial({ color: 0x8d5a3a })
    );
    post.position.set(sx, 2.2, 0);
    g.add(post);
  });
  const itemCols = [0xe63946, 0x457b9d, 0xffb703, 0x2a9d8f, 0x8338ec, 0xff6b35];
  for(let level = 0; level < 3; level++){
    const board = new THREE.Mesh(
      new THREE.BoxGeometry(4, 0.12, 1),
      new THREE.MeshLambertMaterial({ color: 0xd9b08c })
    );
    board.position.set(0, 1 + level * 1.3, 0);
    g.add(board);
    for(let i = 0; i < 6; i++){
      const isCan = (i + level) % 2 === 0;
      const item = isCan
        ? new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.55, 10),
            new THREE.MeshLambertMaterial({ color: itemCols[(i + level * 2) % 6] }))
        : new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.6, 0.42),
            new THREE.MeshLambertMaterial({ color: itemCols[(i * 2 + level) % 6] }));
      item.position.set(-1.7 + i * 0.68, 1.36 + level * 1.3, 0.1);
      g.add(item);
    }
  }
  g.position.set(x, 0, -4);
  scene.add(g);
}
buildShelf(-7.5);
buildShelf(7.5);

/* Mesa de exhibicion (donde llegan los productos desordenados) */
const table = new THREE.Mesh(
  new THREE.BoxGeometry(9.6, 0.9, 1.7),
  new THREE.MeshLambertMaterial({ color: 0xb08968 })
);
table.position.set(0, 0.45, -0.4);
table.castShadow = table.receiveShadow = true;
scene.add(table);

const tableTop = new THREE.Mesh(
  new THREE.BoxGeometry(9.9, 0.12, 2),
  new THREE.MeshLambertMaterial({ color: 0xd9b08c })
);
tableTop.position.set(0, 0.95, -0.4);
tableTop.receiveShadow = true;
scene.add(tableTop);

/* ============================================================
   MODELOS DE PRODUCTOS (low-poly)
   ============================================================ */
function lam(color){ return new THREE.MeshLambertMaterial({ color }); }

const productBuilders = {
  cuaderno(){
    const g = new THREE.Group();
    const pages = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.86, 0.1), lam(0xffffff));
    pages.position.set(0.02, 0.45, -0.03);
    const cover = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.9, 0.06), lam(0x2666cf));
    cover.position.set(0, 0.45, 0.04);
    g.add(pages, cover);
    g.rotation.y = -0.25;
    return g;
  },
  lapices(){
    const g = new THREE.Group();
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.16, 0.4, 10), lam(0x9d4edd));
    cup.position.y = 0.2;
    g.add(cup);
    [[0xffd60a, -0.07, 0.12], [0xe63946, 0.06, -0.1], [0x2a9d8f, 0.02, 0.05]].forEach(([c, dx, rz], i) => {
      const pencil = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.7, 6), lam(c));
      pencil.position.set(dx, 0.55, (i - 1) * 0.05);
      pencil.rotation.z = rz;
      const tip = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.1, 6), lam(0x3d2b1f));
      tip.position.y = 0.4;
      pencil.add(tip);
      g.add(pencil);
    });
    return g;
  },
  estuche(){
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.34, 0.42), lam(0xc1121f));
    body.position.y = 0.17;
    const lid = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.1, 0.42), lam(0x780000));
    lid.position.y = 0.39;
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.03, 8, 14, Math.PI), lam(0x780000));
    handle.position.y = 0.44;
    g.add(body, lid, handle);
    g.rotation.y = 0.3;
    return g;
  },
  regla(){
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.95, 0.05), lam(0xffd60a));
    body.position.y = 0.48;
    g.add(body);
    for(let i = 0; i < 5; i++){
      const mark = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.025, 0.055), lam(0x3d2b1f));
      mark.position.set(-0.04, 0.15 + i * 0.18, 0);
      g.add(mark);
    }
    g.rotation.y = -0.2;
    g.rotation.z = -0.12;
    return g;
  },
  mochila(){
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.78, 0.36), lam(0x2a9d8f));
    body.position.y = 0.4;
    const pocket = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.32, 0.1), lam(0x1d7a6f));
    pocket.position.set(0, 0.28, 0.22);
    const flap = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.2, 0.4), lam(0x1d7a6f));
    flap.position.y = 0.74;
    g.add(body, pocket, flap);
    g.rotation.y = 0.2;
    return g;
  },
  zapatillas(){
    const g = new THREE.Group();
    [-0.18, 0.18].forEach((x, i) => {
      const sole = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.1, 0.62), lam(0xffffff));
      sole.position.set(x, 0.05, i * 0.12);
      const upper = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.18, 0.5), lam(0x457b9d));
      upper.position.set(x, 0.19, -0.04 + i * 0.12);
      g.add(sole, upper);
    });
    g.rotation.y = -0.4;
    return g;
  },
  audifonos(){
    const g = new THREE.Group();
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.045, 8, 16, Math.PI), lam(0x1d3557));
    band.position.y = 0.35;
    const earL = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), lam(0xe63946));
    earL.position.set(-0.3, 0.33, 0);
    const earR = earL.clone();
    earR.position.x = 0.3;
    g.add(band, earL, earR);
    g.rotation.y = 0.25;
    return g;
  },
  colacion(){
    const g = new THREE.Group();
    const bread1 = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.12, 0.62), lam(0xe9c46a));
    bread1.position.y = 0.06;
    const lettuce = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.05, 0.66), lam(0x80b918));
    lettuce.position.y = 0.15;
    const cheese = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.05, 0.64), lam(0xffb703));
    cheese.position.y = 0.2;
    const bread2 = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.14, 0.6), lam(0xddb25f));
    bread2.position.y = 0.3;
    g.add(bread1, lettuce, cheese, bread2);
    g.rotation.y = 0.5;
    return g;
  }
};

const PRODUCT_POOL = [
  ['cuaderno',  'Cuaderno'],
  ['lapices',   'Lápices'],
  ['estuche',   'Estuche'],
  ['regla',     'Regla'],
  ['mochila',   'Mochila'],
  ['zapatillas','Zapatillas'],
  ['audifonos', 'Audífonos'],
  ['colacion',  'Colación']
];

/* ---------- Etiqueta de precio (sprite siempre de frente) ---------- */
function priceTagSprite(name, price){
  const tex = canvasTexture(512, 256, ctx => {
    ctx.fillStyle = 'rgba(255,255,255,0.97)';
    ctx.strokeStyle = '#e76f51';
    ctx.lineWidth = 14;
    const r = 36;
    ctx.beginPath();
    ctx.moveTo(r, 8);
    ctx.lineTo(512 - r, 8); ctx.quadraticCurveTo(504, 8, 504, r + 8);
    ctx.lineTo(504, 248 - r); ctx.quadraticCurveTo(504, 248, 512 - r, 248);
    ctx.lineTo(r, 248); ctx.quadraticCurveTo(8, 248, 8, 248 - r);
    ctx.lineTo(8, r + 8); ctx.quadraticCurveTo(8, 8, r, 8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#1d3557';
    ctx.font = 'bold 64px Arial';
    ctx.fillText(name, 256, 90);
    ctx.fillStyle = '#e63946';
    ctx.font = 'bold 92px Arial';
    ctx.fillText('$' + formatNumber(price), 256, 200);
  });
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex }));
  sprite.scale.set(1.7, 0.85, 1);
  return sprite;
}

/* ---------- Repisas numeradas (zonas de respuesta) ---------- */
function slotLabelSprite(index){
  const tex = canvasTexture(256, 200, ctx => {
    ctx.fillStyle = '#1d3557';
    ctx.beginPath();
    ctx.arc(128, 80, 70, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.font = 'bold 96px Arial';
    ctx.fillText(String(index + 1), 128, 114);
    if(index === 0 || index === 5){
      ctx.fillStyle = index === 0 ? '#2a9d8f' : '#e63946';
      ctx.font = 'bold 44px Arial';
      ctx.fillText(index === 0 ? 'MENOR' : 'MAYOR', 128, 188);
    }
  });
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex }));
  sprite.scale.set(1.05, 0.82, 1);
  return sprite;
}

const slots = [];
const slotHitMeshes = [];
const hitMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });

for(let i = 0; i < 6; i++){
  const x = -4.4 + i * 1.76;
  const pad = new THREE.Mesh(
    new THREE.CylinderGeometry(0.62, 0.68, 0.16, 20),
    new THREE.MeshLambertMaterial({ color: 0xf4a261 })
  );
  pad.position.set(x, 0.08, 2.9);
  pad.receiveShadow = true;
  scene.add(pad);

  const label = slotLabelSprite(i);
  label.position.set(x, 1.45, 3.35);
  scene.add(label);

  const hit = new THREE.Mesh(new THREE.BoxGeometry(2.0, 3.0, 2.2), hitMat);
  hit.position.set(x, 1.5, 2.9);
  hit.userData.slotIndex = i;
  scene.add(hit);
  slotHitMeshes.push(hit);

  slots.push({ pad, x, z: 2.9, product: null });
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

let products = [];
let held = null;
const tweens = [];

function tweenTo(group, target, dur, lift){
  tweens.push({ pos: group.position, from: group.position.clone(), to: target.clone(), t: 0, dur, lift: lift || 0 });
}

function clearProducts(){
  products.forEach(p => {
    scene.remove(p.root);
  });
  products = [];
  held = null;
  slots.forEach(s => { s.product = null; });
}

function setupRound(){
  clearProducts();
  completed = false;
  verifyBtn.disabled = false;
  nextBtn.disabled = true;
  feedback.className = 'hud-feedback';
  scoreEl.textContent = getScore();

  const picks = shuffle(PRODUCT_POOL).slice(0, 6);
  const prices = uniqueRandomNumbers(6, 1100, 9900, 35).sort((a, b) => a - b);
  // picks[i] recibe prices[i]; se muestran desordenados en la mesa
  const order = shuffle([0, 1, 2, 3, 4, 5]);

  picks.forEach(([type, name], i) => {
    const root = new THREE.Group();
    const model = productBuilders[type]();
    model.scale.setScalar(1.25);
    model.traverse(o => { if(o.isMesh){ o.castShadow = true; } });
    root.add(model);

    const tag = priceTagSprite(name, prices[i]);
    tag.position.y = 1.55;
    root.add(tag);

    const hit = new THREE.Mesh(new THREE.BoxGeometry(1.3, 2.2, 1.2), hitMat);
    hit.position.y = 1;
    hit.userData.productIdx = i;
    root.add(hit);

    const tableX = -4 + order[i] * 1.6;
    const home = new THREE.Vector3(tableX, 1.01, -0.4);
    root.position.copy(home);
    scene.add(root);

    products.push({ root, model, hit, name, price: prices[i], home, slot: null });
  });

  goalEl.classList.remove('hidden');
}

/* ---------- Resaltado del producto tomado ---------- */
function setHighlight(product, on){
  product.model.traverse(o => {
    if(o.isMesh && o.material && o.material.emissive){
      o.material = o.material.clone();
      o.material.emissive.setHex(on ? 0x554400 : 0x000000);
    }
  });
  product.model.scale.setScalar(on ? 1.45 : 1.25);
}

function pickUp(product){
  if(held) setHighlight(held, false);
  if(held === product){
    // soltar donde estaba
    dropAtHome(held);
    held = null;
    return;
  }
  held = product;
  setHighlight(product, true);
  const lift = product.root.position.clone();
  lift.y = (product.slot !== null ? 0.18 : 1.01) + 0.7;
  tweenTo(product.root, lift, 0.25);
  playClick();
}

function dropAtHome(product){
  if(product.slot !== null){ slots[product.slot].product = null; product.slot = null; }
  setHighlight(product, false);
  tweenTo(product.root, product.home, 0.4, 1.2);
}

function placeInSlot(product, slotIdx){
  const slot = slots[slotIdx];
  if(slot.product && slot.product !== product){
    dropAtHome(slot.product); // el ocupante vuelve a la mesa
  }
  if(product.slot !== null) slots[product.slot].product = null;
  slot.product = product;
  product.slot = slotIdx;
  setHighlight(product, false);
  held = null;
  tweenTo(product.root, new THREE.Vector3(slot.x, 0.18, slot.z), 0.45, 1.4);
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
  const prodHits = raycaster.intersectObjects(products.map(p => p.hit));
  const slotHits = raycaster.intersectObjects(slotHitMeshes);
  const prod = prodHits.length ? products[prodHits[0].object.userData.productIdx] : null;
  const slot = slotHits.length ? slotHits[0].object.userData.slotIndex : null;
  if(prod && slot !== null){
    // sin nada en la mano: prioridad al producto (tomarlo);
    // con algo en la mano: prioridad a la repisa (colocarlo)
    return held ? { slot } : { prod };
  }
  return { prod, slot };
}

renderer.domElement.addEventListener('pointermove', e => {
  const { prod, slot } = pick(e.clientX, e.clientY);
  renderer.domElement.style.cursor = (prod || slot !== null) ? 'pointer' : 'default';
});

renderer.domElement.addEventListener('pointerup', e => {
  if(completed) return;
  const { prod, slot } = pick(e.clientX, e.clientY);
  if(prod){
    pickUp(prod);
  } else if(slot !== null && held){
    placeInSlot(held, slot);
  } else if(held){
    // clic en un espacio vacio: el producto vuelve a su lugar
    dropAtHome(held);
    held = null;
  }
});

/* ============================================================
   VERIFICACION Y CELEBRACION
   ============================================================ */
const PRAISES = ['¡Muy bien!', '¡Excelente trabajo!', '¡Lo lograste!', '¡Eres increíble!'];

const confetti = [];
const confettiCols = [0xe63946, 0xffb703, 0x2a9d8f, 0x8338ec, 0x457b9d];
for(let i = 0; i < 60; i++){
  const piece = new THREE.Mesh(
    new THREE.PlaneGeometry(0.18, 0.18),
    new THREE.MeshBasicMaterial({ color: confettiCols[i % 5], side: THREE.DoubleSide })
  );
  piece.visible = false;
  confetti.push(piece);
  scene.add(piece);
}

function launchConfetti(){
  confetti.forEach(p => {
    p.visible = true;
    p.position.set((Math.random() - 0.5) * 10, 6 + Math.random() * 3, Math.random() * 4);
    p.userData.vy = -(1.5 + Math.random() * 2);
    p.userData.rx = Math.random() * 4;
    p.userData.rz = Math.random() * 4;
  });
}

function verify(){
  if(completed) return;
  if(slots.some(s => !s.product)){
    showFeedback('Coloca los 6 productos en las repisas primero.', 'bad');
    return;
  }
  if(held){ setHighlight(held, false); held = null; }

  const ok = slots.every((s, i) => i === 0 || slots[i - 1].product.price < s.product.price);

  if(ok){
    completed = true;
    const gained = 100 + GAME_NUMBER * 15;
    setScore(getScore() + gained);
    setUnlocked(GAME_NUMBER + 1);
    const praise = PRAISES[Math.floor(Math.random() * PRAISES.length)];
    showFeedback(praise + ' Ganaste ' + gained + ' puntos.', 'good');
    try { winSound.currentTime = 0; winSound.play(); } catch(e){}
    launchConfetti();
    products.forEach((p, i) => {
      setTimeout(() => {
        const up = p.root.position.clone(); up.y += 1;
        tweenTo(p.root, p.root.position.clone(), 0.6, 2.2);
      }, i * 120);
    });
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

  /* tweens de movimiento (con arco) */
  for(let i = tweens.length - 1; i >= 0; i--){
    const tw = tweens[i];
    tw.t += dt / tw.dur;
    const k = Math.min(1, tw.t);
    const e = 1 - Math.pow(1 - k, 3); // easeOutCubic
    tw.pos.lerpVectors(tw.from, tw.to, e);
    tw.pos.y += Math.sin(e * Math.PI) * tw.lift * 0.35;
    if(k >= 1){
      tw.pos.copy(tw.to);
      tweens.splice(i, 1);
    }
  }

  /* producto tomado flota */
  if(held && !tweens.some(tw => tw.pos === held.root.position)){
    held.root.position.y += Math.sin(time * 5) * 0.0035;
  }

  /* confeti */
  confetti.forEach(p => {
    if(!p.visible) return;
    p.position.y += p.userData.vy * dt;
    p.rotation.x += p.userData.rx * dt;
    p.rotation.z += p.userData.rz * dt;
    if(p.position.y < 0.05) p.visible = false;
  });

  /* leve balanceo de camara */
  camera.position.x = Math.sin(time * 0.25) * 0.35;
  camera.lookAt(0, 1.9, 0.4);

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

speak('Toca un producto para tomarlo y luego toca una repisa numerada. Ordena del precio menor al precio mayor.');
setTimeout(() => goalEl.classList.add('hidden'), 14000);

})();
