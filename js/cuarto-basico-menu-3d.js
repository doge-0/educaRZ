/* ============================================================
   EducaRZ - Menu 3D "El Tren de los Numeros" (4 Basico)
   Campo low-poly con tren que viaja entre 6 estaciones-juego.
   Requiere js/lib/three.min.js (r128).
   ============================================================ */

(function(){
'use strict';

/* ---------- Datos de los juegos ---------- */
const GAMES = [
  { title: 'Tienda ordenada',   text: 'Ordena productos desde el menor precio hasta el mayor.',          page: 'juego-tienda-ordenada-3d.html', color: 0xe76f51, icon: '🛒', theme: 'tienda' },
  { title: 'Recta numérica',    text: 'Ordena los autos por kilómetros recorridos, de menor a mayor.',   page: 'juego-recta-3d.html',          color: 0x457b9d, icon: '🏎️', theme: 'recta' },
  { title: 'Reloj de memoria',  text: 'Memoriza una hora digital y escribe el número antes de avanzar.', page: 'juego-tabla-posicional-3d.html', color: 0x8338ec, icon: '⏰', theme: 'reloj' },
  { title: 'Mayor o menor',     text: 'Compara números y escoge el signo correcto.',                     page: 'juego-mayor-menor-3d.html',    color: 0x2a9d8f, icon: '⚖️', theme: 'balanza' },
  { title: 'Representaciones',  text: 'Relaciona números con su descomposición o lectura.',              page: 'juego-representaciones-3d.html', color: 0xfb8500, icon: '🔢', theme: 'bloques' },
  { title: 'Sudoku matemático', text: 'Completa la cuadrícula con números sin repetir.',                 page: 'juego-sudoku-3d.html',         color: 0xe63946, icon: '🧩', theme: 'sudoku' }
];

/* ---------- Progreso ---------- */
function getScore(){ return Number(localStorage.getItem('cuartoBasicoScore') || '0'); }
function getUnlocked(){ return Number(localStorage.getItem('cuartoBasicoUnlocked') || '1'); }

/* ---------- Comprobacion de WebGL ---------- */
function hasWebGL(){
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl')));
  } catch(e){ return false; }
}
if(!window.THREE || !hasWebGL()){
  window.location.href = 'cuarto-basico.html';
  return;
}

/* ---------- Interfaz ---------- */
const container = document.getElementById('scene-container');
const scoreEl   = document.getElementById('puntajeMenu');
const hint      = document.getElementById('hudHint');
const loading   = document.getElementById('loadingOverlay');

const clickSound = new Audio('sonidos/click.mp3');
function playClick(){ try { clickSound.currentTime = 0; clickSound.play(); } catch(e){} }

/* Musica ambiente (la misma del juego del reloj) */
const ambientMusic = new Audio('sonidos/reloj.mp3');
ambientMusic.loop = true;
ambientMusic.volume = 0.3;
function startAmbientMusic(){
  ambientMusic.play().then(() => {
    window.removeEventListener('pointerdown', startAmbientMusic);
    window.removeEventListener('keydown', startAmbientMusic);
  }).catch(() => {});
}
startAmbientMusic(); // si el navegador lo bloquea, parte con la primera interaccion
window.addEventListener('pointerdown', startAmbientMusic);
window.addEventListener('keydown', startAmbientMusic);

function showHint(text){
  hint.textContent = text;
  hint.classList.remove('hidden');
}

scoreEl.textContent = getScore();

/* ============================================================
   ESCENA
   ============================================================ */
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x8fd3f4);
scene.fog = new THREE.Fog(0x8fd3f4, 90, 190);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 400);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
container.appendChild(renderer.domElement);

/* ---------- Luces ---------- */
scene.add(new THREE.HemisphereLight(0xcfeefc, 0x7ec850, 0.85));

const sun = new THREE.DirectionalLight(0xfff3d6, 1.0);
sun.position.set(40, 60, 25);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -70;
sun.shadow.camera.right = 70;
sun.shadow.camera.top = 70;
sun.shadow.camera.bottom = -70;
sun.shadow.camera.far = 200;
scene.add(sun);

const sunBall = new THREE.Mesh(
  new THREE.SphereGeometry(5, 16, 16),
  new THREE.MeshBasicMaterial({ color: 0xffe066 })
);
sunBall.position.set(80, 70, 30);
scene.add(sunBall);

/* ---------- Terreno con relieve ----------
   Plano en la zona de la via/estaciones (r < 48) y lomas
   suaves hacia afuera. terrainY() permite apoyar la
   vegetacion sobre el relieve. */
function terrainY(x, z){
  const r = Math.sqrt(x * x + z * z);
  if(r < 48) return 0;
  const ramp = Math.min(1, (r - 48) / 35);
  const n =
    Math.sin(x * 0.055 + 1.3) * Math.cos(z * 0.06 - 0.7) * 2.6 +
    Math.sin(x * 0.13 - 0.4) * Math.sin(z * 0.11 + 2.1) * 1.1 +
    Math.cos(r * 0.045) * 1.4;
  return Math.max(-0.6, n) * ramp;
}

// PlaneGeometry con cuadricula interior para poder deformarla
// (CircleGeometry es un abanico sin vertices interiores)
const groundGeo = new THREE.PlaneGeometry(360, 360, 110, 110);
{
  const pos = groundGeo.attributes.position;
  for(let i = 0; i < pos.count; i++){
    // El plano esta en XY; al rotarlo -90 en X el mundo queda (x, z, -y),
    // asi que la altura del terreno va en Z antes de rotar.
    const x = pos.getX(i);
    const y = pos.getY(i);
    pos.setZ(i, terrainY(x, -y));
  }
  groundGeo.computeVertexNormals();
}
const ground = new THREE.Mesh(
  groundGeo,
  new THREE.MeshLambertMaterial({ color: 0x7ec850 })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

const meadow = new THREE.Mesh(
  new THREE.CircleGeometry(20, 32),
  new THREE.MeshLambertMaterial({ color: 0x95d96a })
);
meadow.rotation.x = -Math.PI / 2;
meadow.position.y = 0.06;
scene.add(meadow);

/* Parches de pasto de otro tono */
const patchMat = new THREE.MeshLambertMaterial({ color: 0x8fd166 });
[[10, -12, 5], [-13, -9, 4], [4, 14, 6]].forEach(([x, z, s]) => {
  const patch = new THREE.Mesh(new THREE.CircleGeometry(s, 20), patchMat);
  patch.rotation.x = -Math.PI / 2;
  patch.position.set(x, 0.1, z);
  scene.add(patch);
});

/* ---------- Via del tren ---------- */
const trackPoints = [];
const STATION_COUNT = GAMES.length;
for(let i = 0; i < 12; i++){
  const a = (i / 12) * Math.PI * 2;
  const r = 30 + Math.sin(a * 3) * 3.5;
  trackPoints.push(new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r));
}
const trackCurve = new THREE.CatmullRomCurve3(trackPoints, true, 'catmullrom', 0.6);
const trackLength = trackCurve.getLength();

function curveNormalAt(u){
  const t = trackCurve.getTangentAt(u);
  return new THREE.Vector3(t.z, 0, -t.x).normalize();
}

function buildRail(offset){
  const pts = [];
  const N = 240;
  for(let i = 0; i < N; i++){
    const u = i / N;
    const p = trackCurve.getPointAt(u);
    const n = curveNormalAt(u);
    pts.push(new THREE.Vector3(p.x + n.x * offset, 0.18, p.z + n.z * offset));
  }
  const railCurve = new THREE.CatmullRomCurve3(pts, true);
  const rail = new THREE.Mesh(
    new THREE.TubeGeometry(railCurve, 360, 0.13, 6, true),
    new THREE.MeshLambertMaterial({ color: 0x6b705c })
  );
  rail.castShadow = true;
  scene.add(rail);
}
buildRail(0.75);
buildRail(-0.75);

const tieGeo = new THREE.BoxGeometry(2.3, 0.14, 0.55);
const tieMat = new THREE.MeshLambertMaterial({ color: 0x8d5a3a });
const TIES = 130;
for(let i = 0; i < TIES; i++){
  const u = i / TIES;
  const p = trackCurve.getPointAt(u);
  const t = trackCurve.getTangentAt(u);
  const tie = new THREE.Mesh(tieGeo, tieMat);
  tie.position.set(p.x, 0.07, p.z);
  tie.rotation.y = Math.atan2(t.x, t.z);
  tie.receiveShadow = true;
  scene.add(tie);
}

/* ============================================================
   TEXTURAS DE CANVAS
   ============================================================ */
function canvasTexture(w, h, draw){
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'));
  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 4;
  return tex;
}

function makeSignTexture(game, index){
  return canvasTexture(512, 256, ctx => {
    const col = '#' + game.color.toString(16).padStart(6, '0');
    ctx.fillStyle = '#fffdf5';
    ctx.fillRect(0, 0, 512, 256);
    ctx.strokeStyle = col;
    ctx.lineWidth = 18;
    ctx.strokeRect(9, 9, 494, 238);
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(70, 70, 42, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 52px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(index + 1), 70, 74);
    ctx.font = '64px Arial';
    ctx.fillText(game.icon, 440, 74);
    ctx.fillStyle = '#1d3557';
    ctx.font = 'bold 44px Arial';
    if(ctx.measureText(game.title).width > 460){
      const words = game.title.split(' ');
      ctx.fillText(words[0], 256, 150);
      ctx.fillText(words.slice(1).join(' '), 256, 205);
    } else {
      ctx.fillText(game.title, 256, 178);
    }
  });
}

const numberLineTex = canvasTexture(1024, 160, ctx => {
  ctx.fillStyle = '#fffdf5';
  ctx.fillRect(0, 0, 1024, 160);
  ctx.strokeStyle = '#1d3557';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(40, 80); ctx.lineTo(984, 80);
  ctx.stroke();
  ctx.textAlign = 'center';
  for(let i = 0; i <= 10; i++){
    const x = 70 + i * 88.4;
    ctx.beginPath();
    ctx.moveTo(x, 58); ctx.lineTo(x, 102);
    ctx.stroke();
    ctx.fillStyle = '#e63946';
    ctx.font = 'bold 40px Arial';
    ctx.fillText(String(i), x, 140);
  }
  // flechas
  ctx.fillStyle = '#1d3557';
  ctx.beginPath(); ctx.moveTo(10, 80); ctx.lineTo(44, 62); ctx.lineTo(44, 98); ctx.fill();
  ctx.beginPath(); ctx.moveTo(1014, 80); ctx.lineTo(980, 62); ctx.lineTo(980, 98); ctx.fill();
});

const clockTex = canvasTexture(256, 256, ctx => {
  ctx.fillStyle = '#fffdf5';
  ctx.beginPath(); ctx.arc(128, 128, 120, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#1d3557';
  ctx.lineWidth = 12;
  ctx.beginPath(); ctx.arc(128, 128, 114, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = '#1d3557';
  ctx.font = 'bold 34px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('12', 128, 40); ctx.fillText('3', 216, 128);
  ctx.fillText('6', 128, 216); ctx.fillText('9', 40, 128);
  ctx.lineWidth = 10;
  ctx.beginPath(); ctx.moveTo(128, 128); ctx.lineTo(128, 62); ctx.stroke();
  ctx.lineWidth = 8;
  ctx.beginPath(); ctx.moveTo(128, 128); ctx.lineTo(180, 150); ctx.stroke();
  ctx.fillStyle = '#e63946';
  ctx.beginPath(); ctx.arc(128, 128, 10, 0, Math.PI * 2); ctx.fill();
});

const sudokuTex = canvasTexture(256, 256, ctx => {
  ctx.fillStyle = '#fffdf5';
  ctx.fillRect(0, 0, 256, 256);
  ctx.strokeStyle = '#1d3557';
  ctx.lineWidth = 8;
  const cell = 248 / 3;
  for(let i = 0; i <= 3; i++){
    ctx.beginPath(); ctx.moveTo(4 + i * cell, 4); ctx.lineTo(4 + i * cell, 252); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(4, 4 + i * cell); ctx.lineTo(252, 4 + i * cell); ctx.stroke();
  }
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 56px Arial';
  const nums = [['3','',''],['','7',''],['','','5']];
  const cols = ['#e63946', '#457b9d', '#2a9d8f'];
  nums.forEach((row, r) => row.forEach((n, c) => {
    if(!n) return;
    ctx.fillStyle = cols[(r + c) % 3];
    ctx.fillText(n, 4 + c * cell + cell / 2, 4 + r * cell + cell / 2);
  }));
});

const compareTex = canvasTexture(256, 128, ctx => {
  ctx.fillStyle = '#fffdf5';
  ctx.fillRect(0, 0, 256, 128);
  ctx.strokeStyle = '#2a9d8f';
  ctx.lineWidth = 8;
  ctx.strokeRect(4, 4, 248, 120);
  ctx.fillStyle = '#1d3557';
  ctx.font = 'bold 72px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('8 > 5', 128, 68);
});

/* ============================================================
   DECORACION TEMATICA DE CADA ESTACION
   (se agrega al grupo "content"; +Z mira hacia la via)
   ============================================================ */
const themeBuilders = {

  /* Puestito de mercado con toldo y frutas */
  tienda(content){
    const awning = new THREE.Mesh(
      new THREE.BoxGeometry(2.6, 0.08, 1.1),
      new THREE.MeshLambertMaterial({ color: 0xffffff })
    );
    awning.position.set(0, 2.55, 1.05);
    awning.rotation.x = 0.35;
    awning.castShadow = true;
    content.add(awning);
    // franjas del toldo
    for(let i = 0; i < 3; i++){
      const stripe = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.09, 1.1),
        new THREE.MeshLambertMaterial({ color: 0xe63946 })
      );
      stripe.position.set(-0.9 + i * 0.9, 2.56, 1.05);
      stripe.rotation.x = 0.35;
      content.add(stripe);
    }
    // mesa con frutas
    const table = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 0.5, 0.9),
      new THREE.MeshLambertMaterial({ color: 0xb08968 })
    );
    table.position.set(2.1, 0.95, 1.3);
    table.castShadow = true;
    content.add(table);
    const fruitCols = [0xff6b35, 0xc1121f, 0xffd60a, 0x80b918, 0xff6b35, 0xc1121f];
    fruitCols.forEach((c, i) => {
      const fruit = new THREE.Mesh(
        new THREE.SphereGeometry(0.16, 8, 6),
        new THREE.MeshLambertMaterial({ color: c })
      );
      fruit.position.set(1.7 + (i % 3) * 0.4, 1.33, 1.1 + Math.floor(i / 3) * 0.38);
      fruit.castShadow = true;
      content.add(fruit);
    });
    // cajas apiladas
    [[-2.1, 0.95, 1.2, 0.7], [-2.1, 1.55, 1.2, 0.5], [-1.4, 0.9, 1.4, 0.6]].forEach(([x, y, z, s]) => {
      const crate = new THREE.Mesh(
        new THREE.BoxGeometry(s, s, s),
        new THREE.MeshLambertMaterial({ color: 0xd4a373 })
      );
      crate.position.set(x, y, z);
      crate.castShadow = true;
      content.add(crate);
    });
  },

  /* Gran recta numerica sobre postes */
  recta(content){
    const board = new THREE.Mesh(
      new THREE.PlaneGeometry(4.6, 0.75),
      new THREE.MeshBasicMaterial({ map: numberLineTex, side: THREE.DoubleSide })
    );
    board.position.set(0, 1.5, 1.7);
    content.add(board);
    [-2.1, 2.1].forEach(x => {
      const post = new THREE.Mesh(
        new THREE.CylinderGeometry(0.09, 0.09, 1.6, 6),
        new THREE.MeshLambertMaterial({ color: 0x8d5a3a })
      );
      post.position.set(x, 0.8, 1.7);
      post.castShadow = true;
      content.add(post);
    });
    // conos numerados de colores a los lados
    [[-2.9, 0x457b9d], [2.9, 0xe63946]].forEach(([x, c]) => {
      const cone = new THREE.Mesh(
        new THREE.ConeGeometry(0.35, 0.9, 8),
        new THREE.MeshLambertMaterial({ color: c })
      );
      cone.position.set(x, 0.45, 1.5);
      cone.castShadow = true;
      content.add(cone);
    });
  },

  /* Torre de reloj */
  reloj(content){
    const tower = new THREE.Mesh(
      new THREE.BoxGeometry(1.3, 4.2, 1.3),
      new THREE.MeshLambertMaterial({ color: 0x9d4edd })
    );
    tower.position.set(2.5, 2.1, -0.4);
    tower.castShadow = true;
    content.add(tower);
    const roof = new THREE.Mesh(
      new THREE.ConeGeometry(1.15, 1.1, 4),
      new THREE.MeshLambertMaterial({ color: 0x5a189a })
    );
    roof.position.set(2.5, 4.75, -0.4);
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    content.add(roof);
    const face = new THREE.Mesh(
      new THREE.CircleGeometry(0.52, 24),
      new THREE.MeshBasicMaterial({ map: clockTex })
    );
    face.position.set(2.5, 3.4, 0.26);
    content.add(face);
  },

  /* Balanza con esferas grande/pequena */
  balanza(content){
    const mat = new THREE.MeshLambertMaterial({ color: 0x6b705c });
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 2.4, 8), mat);
    post.position.set(2.4, 1.2, 1.1);
    post.castShadow = true;
    content.add(post);
    const beam = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.12, 0.12), mat);
    beam.position.set(2.4, 2.4, 1.1);
    beam.rotation.z = 0.28;
    beam.castShadow = true;
    content.add(beam);
    // platillos: el lado con esfera grande cuelga mas abajo
    [[1.25, 1.45, 0.42, 0xe76f51], [3.55, 2.35, 0.24, 0x457b9d]].forEach(([x, topY, ballR, c]) => {
      const string = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.8, 4), mat);
      string.position.set(x, topY - 0.4, 1.1);
      content.add(string);
      const pan = new THREE.Mesh(
        new THREE.CylinderGeometry(0.5, 0.4, 0.12, 12),
        new THREE.MeshLambertMaterial({ color: 0xffb703 })
      );
      pan.position.set(x, topY - 0.85, 1.1);
      pan.castShadow = true;
      content.add(pan);
      const ball = new THREE.Mesh(
        new THREE.SphereGeometry(ballR, 10, 8),
        new THREE.MeshLambertMaterial({ color: c })
      );
      ball.position.set(x, topY - 0.78 + ballR, 1.1);
      ball.castShadow = true;
      content.add(ball);
    });
    // cartel 8 > 5
    const card = new THREE.Mesh(
      new THREE.PlaneGeometry(1.5, 0.75),
      new THREE.MeshBasicMaterial({ map: compareTex, side: THREE.DoubleSide })
    );
    card.position.set(-2.3, 1.1, 1.5);
    content.add(card);
    const cardPost = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.75, 6), mat);
    cardPost.position.set(-2.3, 0.37, 1.5);
    content.add(cardPost);
  },

  /* Bloques multibase (centenas, decenas, unidades) */
  bloques(content){
    const cubeGeo = new THREE.BoxGeometry(0.34, 0.34, 0.34);
    const orange = new THREE.MeshLambertMaterial({ color: 0xfb8500 });
    const yellow = new THREE.MeshLambertMaterial({ color: 0xffb703 });
    const blue   = new THREE.MeshLambertMaterial({ color: 0x457b9d });
    // bloque de "centena": 3x3x3
    for(let x = 0; x < 3; x++) for(let y = 0; y < 3; y++) for(let z = 0; z < 3; z++){
      const cube = new THREE.Mesh(cubeGeo, orange);
      cube.position.set(2 + x * 0.36, 0.87 + y * 0.36, 0.9 + z * 0.36);
      cube.castShadow = (y === 2);
      content.add(cube);
    }
    // barra de "decena": fila de 5
    for(let i = 0; i < 5; i++){
      const cube = new THREE.Mesh(cubeGeo, yellow);
      cube.position.set(-1.6 - i * 0.36, 0.87, 1.5);
      cube.castShadow = true;
      content.add(cube);
    }
    // "unidad"
    const unit = new THREE.Mesh(cubeGeo, blue);
    unit.position.set(-2.2, 1.23, 1.5);
    unit.castShadow = true;
    content.add(unit);
  },

  /* Dado gigante y cuadricula sudoku */
  sudoku(content){
    const dice = new THREE.Mesh(
      new THREE.BoxGeometry(1.15, 1.15, 1.15),
      new THREE.MeshBasicMaterial({ map: sudokuTex })
    );
    dice.position.set(2.3, 1.3, 1.1);
    dice.rotation.y = 0.5;
    dice.castShadow = true;
    content.add(dice);
    const dice2 = new THREE.Mesh(
      new THREE.BoxGeometry(0.75, 0.75, 0.75),
      new THREE.MeshBasicMaterial({ map: sudokuTex })
    );
    dice2.position.set(-2.2, 1.1, 1.3);
    dice2.rotation.y = -0.4;
    dice2.castShadow = true;
    content.add(dice2);
  }
};

/* ============================================================
   ESTACIONES
   ============================================================ */
const stations = [];
const hitMeshes = [];
const hitMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });

function buildStation(game, index){
  const u = index / STATION_COUNT;
  const p = trackCurve.getPointAt(u);
  const n = curveNormalAt(u);
  const outward = (n.dot(p) > 0) ? n.clone() : n.clone().negate();

  const g = new THREE.Group();
  g.position.set(p.x + outward.x * 4.2, 0, p.z + outward.z * 4.2);
  g.lookAt(p.x, 0, p.z);

  // grupo interior: las animaciones (sacudida/pulso) se aplican
  // aqui para no pisar la rotacion del lookAt del grupo padre
  const content = new THREE.Group();
  g.add(content);

  const col = new THREE.Color(game.color);
  const colDark = col.clone().multiplyScalar(0.7);

  const platform = new THREE.Mesh(
    new THREE.BoxGeometry(6, 0.7, 2.6),
    new THREE.MeshLambertMaterial({ color: 0xc9b79c })
  );
  platform.position.set(0, 0.35, 1.4);
  platform.castShadow = platform.receiveShadow = true;
  content.add(platform);

  const house = new THREE.Mesh(
    new THREE.BoxGeometry(3.4, 2.2, 2.2),
    new THREE.MeshLambertMaterial({ color: game.color })
  );
  house.position.set(0, 1.8, -0.6);
  house.castShadow = true;
  content.add(house);

  const door = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 1.3, 0.1),
    new THREE.MeshLambertMaterial({ color: 0x5e4632 })
  );
  door.position.set(0, 1.35, 0.51);
  content.add(door);

  [-1.1, 1.1].forEach(x => {
    const win = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 0.6, 0.1),
      new THREE.MeshLambertMaterial({ color: 0xbde0fe })
    );
    win.position.set(x, 1.9, 0.51);
    content.add(win);
  });

  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(2.9, 1.5, 4),
    new THREE.MeshLambertMaterial({ color: colDark.getHex() })
  );
  roof.position.set(0, 3.65, -0.6);
  roof.rotation.y = Math.PI / 4;
  roof.castShadow = true;
  content.add(roof);

  const signTex = makeSignTexture(game, index);
  const signGeo = new THREE.PlaneGeometry(4.4, 2.2);

  const sign = new THREE.Mesh(signGeo, new THREE.MeshBasicMaterial({ map: signTex }));
  sign.position.set(0, 5.6, -0.6);
  content.add(sign);

  // misma cara hacia el exterior, para leerla desde cualquier angulo
  const signOut = new THREE.Mesh(signGeo, new THREE.MeshBasicMaterial({ map: signTex }));
  signOut.position.set(0, 5.6, -0.82);
  signOut.rotation.y = Math.PI;
  content.add(signOut);

  const signBack = new THREE.Mesh(
    new THREE.BoxGeometry(4.6, 2.4, 0.15),
    new THREE.MeshLambertMaterial({ color: 0x8d5a3a })
  );
  signBack.position.set(0, 5.6, -0.71);
  signBack.castShadow = true;
  content.add(signBack);

  // decoracion tematica
  if(themeBuilders[game.theme]) themeBuilders[game.theme](content);

  // candado flotante (bloqueada)
  const lockGroup = new THREE.Group();
  const lockBody = new THREE.Mesh(
    new THREE.BoxGeometry(1.1, 0.9, 0.4),
    new THREE.MeshLambertMaterial({ color: 0x555b6e })
  );
  const lockArc = new THREE.Mesh(
    new THREE.TorusGeometry(0.42, 0.12, 8, 16, Math.PI),
    new THREE.MeshLambertMaterial({ color: 0x8d99ae })
  );
  lockArc.position.y = 0.45;
  lockGroup.add(lockBody, lockArc);
  lockGroup.position.set(0, 7.4, -0.6);
  lockGroup.traverse(o => { o.userData.noGray = true; });
  content.add(lockGroup);

  // bandera (completada)
  const flagGroup = new THREE.Group();
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.06, 2.2, 6),
    new THREE.MeshLambertMaterial({ color: 0xdddddd })
  );
  pole.position.y = 1.1;
  const flag = new THREE.Mesh(
    new THREE.PlaneGeometry(1.2, 0.7),
    new THREE.MeshLambertMaterial({ color: 0x43aa8b, side: THREE.DoubleSide })
  );
  flag.position.set(0.6, 1.85, 0);
  flagGroup.add(pole, flag);
  flagGroup.position.set(2.6, 0.7, 2.2);
  flagGroup.traverse(o => { o.userData.noGray = true; });
  content.add(flagGroup);

  const hit = new THREE.Mesh(new THREE.BoxGeometry(8, 8.5, 6), hitMat);
  hit.position.set(0, 3.5, 0.5);
  hit.userData.stationIndex = index;
  content.add(hit);
  hitMeshes.push(hit);

  // materiales originales para el modo bloqueado (por malla)
  const colored = [];
  content.traverse(o => {
    if(o.isMesh && o.material && o !== hit && !o.userData.noGray){
      colored.push({ mesh: o, mat: o.material, grayMat: null });
    }
  });

  scene.add(g);
  return { group: g, content, lockGroup, flagGroup, flag, colored, u, index, shakeT: 0, pulseT: 0 };
}

GAMES.forEach((game, i) => stations.push(buildStation(game, i)));

function refreshStations(){
  const unlocked = getUnlocked();
  stations.forEach(st => {
    const num = st.index + 1;
    const locked = num > unlocked;
    st.lockGroup.visible = locked;
    st.flagGroup.visible = num < unlocked;
    st.colored.forEach(entry => {
      if(locked){
        if(!entry.grayMat){
          entry.grayMat = entry.mat.clone();
          if(entry.grayMat.map){
            // el letrero conserva su dibujo pero oscurecido
            entry.grayMat.color.setHex(0x8e8e8e);
          } else {
            const c = entry.mat.color;
            const l = (c.r + c.g + c.b) / 3;
            entry.grayMat.color.setRGB(l * 0.55 + 0.3, l * 0.55 + 0.3, l * 0.55 + 0.33);
          }
        }
        entry.mesh.material = entry.grayMat;
      } else {
        entry.mesh.material = entry.mat;
      }
    });
  });
}
refreshStations();

/* ============================================================
   VEGETACION Y DECORACION DEL CAMPO
   ============================================================ */
const decorRand = (min, max) => min + Math.random() * (max - min);

function freeSpot(minR, maxR){
  for(let i = 0; i < 40; i++){
    const a = Math.random() * Math.PI * 2;
    const r = decorRand(minR, maxR);
    if(r > 22 && r < 41) continue; // zona de via y estaciones
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    if(Math.hypot(x + 8, z - 6) < 9) continue; // laguna
    return new THREE.Vector3(x, terrainY(x, z), z);
  }
  return null;
}

const treeTrunkMat = new THREE.MeshLambertMaterial({ color: 0x8d5a3a });
const pineLeafMats = [0x2a9d4f, 0x4caf50, 0x357a38].map(c => new THREE.MeshLambertMaterial({ color: c }));
const roundLeafMats = [0x55a630, 0x80b918, 0x2b9348].map(c => new THREE.MeshLambertMaterial({ color: c }));

/* Pinos */
for(let i = 0; i < 36; i++){
  const pos = freeSpot(8, 120);
  if(!pos) continue;
  const s = decorRand(0.8, 1.8);
  const tree = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.25 * s, 0.35 * s, 1.6 * s, 6), treeTrunkMat);
  trunk.position.y = 0.8 * s;
  trunk.castShadow = true;
  const leaves = new THREE.Mesh(new THREE.ConeGeometry(1.4 * s, 3.2 * s, 7), pineLeafMats[i % 3]);
  leaves.position.y = 3 * s;
  leaves.castShadow = true;
  tree.add(trunk, leaves);
  tree.position.copy(pos);
  scene.add(tree);
}

/* Arboles redondos */
for(let i = 0; i < 20; i++){
  const pos = freeSpot(9, 110);
  if(!pos) continue;
  const s = decorRand(0.7, 1.5);
  const tree = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22 * s, 0.3 * s, 1.8 * s, 6), treeTrunkMat);
  trunk.position.y = 0.9 * s;
  trunk.castShadow = true;
  const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(1.5 * s, 0), roundLeafMats[i % 3]);
  crown.position.y = 2.7 * s;
  crown.castShadow = true;
  tree.add(trunk, crown);
  tree.position.copy(pos);
  scene.add(tree);
}

/* Arbustos */
const bushMat = new THREE.MeshLambertMaterial({ color: 0x3a7d32 });
for(let i = 0; i < 26; i++){
  const pos = freeSpot(7, 100);
  if(!pos) continue;
  const s = decorRand(0.5, 1.1);
  const bush = new THREE.Mesh(new THREE.IcosahedronGeometry(s, 0), bushMat);
  bush.scale.y = 0.65;
  bush.position.copy(pos);
  bush.position.y += s * 0.4;
  bush.castShadow = true;
  scene.add(bush);
}

/* Rocas */
const rockMat = new THREE.MeshLambertMaterial({ color: 0x9a8c98 });
for(let i = 0; i < 16; i++){
  const pos = freeSpot(10, 120);
  if(!pos) continue;
  const s = decorRand(0.3, 1);
  const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(s, 0), rockMat);
  rock.position.copy(pos);
  rock.position.y += s * 0.4;
  rock.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
  rock.castShadow = true;
  scene.add(rock);
}

/* Flores */
const flowerCols = [0xffd60a, 0xff5d8f, 0xffffff, 0xb5179e, 0xff8c42];
const stemMat = new THREE.MeshLambertMaterial({ color: 0x55a630 });
const stemGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.5, 4);
const headGeo = new THREE.IcosahedronGeometry(0.14, 0);
for(let i = 0; i < 34; i++){
  const pos = freeSpot(6, 70);
  if(!pos) continue;
  const flower = new THREE.Group();
  const stem = new THREE.Mesh(stemGeo, stemMat);
  stem.position.y = 0.25;
  const head = new THREE.Mesh(headGeo, new THREE.MeshLambertMaterial({ color: flowerCols[i % flowerCols.length] }));
  head.position.y = 0.55;
  flower.add(stem, head);
  flower.position.copy(pos);
  scene.add(flower);
}

/* Pasto: matas instanciadas (3 draw calls para ~800 matas) */
{
  const grassGeo = new THREE.ConeGeometry(0.16, 0.65, 4);
  grassGeo.translate(0, 0.3, 0);
  const grassTones = [0x5cab3a, 0x6fbf44, 0x4e9c33];
  const mtx = new THREE.Matrix4();
  const quat = new THREE.Quaternion();
  const eul = new THREE.Euler();
  const vPos = new THREE.Vector3();
  const vScl = new THREE.Vector3();

  grassTones.forEach(tone => {
    const count = 270;
    const grass = new THREE.InstancedMesh(
      grassGeo,
      new THREE.MeshLambertMaterial({ color: tone }),
      count
    );
    let placed = 0, guard = 0;
    while(placed < count && guard < count * 8){
      guard++;
      const a = Math.random() * Math.PI * 2;
      const r = 4 + Math.random() * 116;
      if(r > 23 && r < 41) continue;            // via y estaciones
      const x = Math.cos(a) * r, z = Math.sin(a) * r;
      if(Math.hypot(x + 8, z - 6) < 9) continue; // laguna
      const s = 0.7 + Math.random() * 1.1;
      eul.set((Math.random() - 0.5) * 0.3, Math.random() * Math.PI, (Math.random() - 0.5) * 0.3);
      quat.setFromEuler(eul);
      vPos.set(x, terrainY(x, z), z);
      vScl.set(s, s * (0.8 + Math.random() * 0.6), s);
      mtx.compose(vPos, quat, vScl);
      grass.setMatrixAt(placed++, mtx);
    }
    grass.count = placed;
    grass.instanceMatrix.needsUpdate = true;
    scene.add(grass);
  });
}

/* Cerros lejanos */
const hillMat = new THREE.MeshLambertMaterial({ color: 0x6aa84f });
const hillMat2 = new THREE.MeshLambertMaterial({ color: 0x93c47d });
for(let i = 0; i < 7; i++){
  const a = (i / 7) * Math.PI * 2 + 0.4;
  const r = decorRand(95, 135);
  const h = decorRand(14, 30);
  const hill = new THREE.Mesh(new THREE.ConeGeometry(decorRand(18, 30), h, 8), i % 2 ? hillMat : hillMat2);
  hill.position.set(Math.cos(a) * r, h / 2 - 1, Math.sin(a) * r);
  scene.add(hill);
}

/* Laguna con patos */
const pond = new THREE.Mesh(
  new THREE.CircleGeometry(7, 24),
  new THREE.MeshLambertMaterial({ color: 0x4fc3f7 })
);
pond.rotation.x = -Math.PI / 2;
pond.position.set(-8, 0.12, 6);
scene.add(pond);

const ducks = [];
for(let i = 0; i < 3; i++){
  const duck = new THREE.Group();
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 6), new THREE.MeshLambertMaterial({ color: 0xffd60a }));
  body.scale.set(1.3, 0.9, 1);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6), new THREE.MeshLambertMaterial({ color: 0xffd60a }));
  head.position.set(0.4, 0.35, 0);
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.25, 6), new THREE.MeshLambertMaterial({ color: 0xff8c42 }));
  beak.rotation.z = -Math.PI / 2;
  beak.position.set(0.68, 0.33, 0);
  duck.add(body, head, beak);
  duck.position.set(-8, 0.25, 6);
  duck.userData.angle = (i / 3) * Math.PI * 2;
  duck.userData.radius = 2 + i * 1.3;
  ducks.push(duck);
  scene.add(duck);
}

/* Nubes */
const cloudMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
const clouds = [];
for(let i = 0; i < 8; i++){
  const cloud = new THREE.Group();
  const k = decorRand(1, 2);
  [[0,0,0,1.6],[1.4,0.2,0.3,1.1],[-1.3,0.1,-0.2,1.2],[0.4,0.5,-0.5,1]].forEach(([x,y,z,s]) => {
    const puff = new THREE.Mesh(new THREE.SphereGeometry(s * k, 10, 8), cloudMat);
    puff.position.set(x * k, y * k, z * k);
    cloud.add(puff);
  });
  cloud.position.set(decorRand(-90, 90), decorRand(22, 36), decorRand(-90, 90));
  cloud.userData.speed = decorRand(0.4, 1.2);
  clouds.push(cloud);
  scene.add(cloud);
}

/* ============================================================
   TREN
   ============================================================ */
const train = new THREE.Group();
const wheels = [];

function makeWheel(x, z){
  const w = new THREE.Mesh(
    new THREE.CylinderGeometry(0.45, 0.45, 0.25, 12),
    new THREE.MeshLambertMaterial({ color: 0x2b2d42 })
  );
  w.rotation.z = Math.PI / 2;
  w.position.set(x, 0.45, z);
  w.castShadow = true;
  wheels.push(w);
  return w;
}

const loco = new THREE.Group();
{
  const chassis = new THREE.Mesh(
    new THREE.BoxGeometry(1.6, 0.4, 3.6),
    new THREE.MeshLambertMaterial({ color: 0x2b2d42 })
  );
  chassis.position.y = 0.7;
  chassis.castShadow = true;
  loco.add(chassis);

  const boiler = new THREE.Mesh(
    new THREE.CylinderGeometry(0.65, 0.65, 2.1, 14),
    new THREE.MeshLambertMaterial({ color: 0xe63946 })
  );
  boiler.rotation.x = Math.PI / 2;
  boiler.position.set(0, 1.45, 0.7);
  boiler.castShadow = true;
  loco.add(boiler);

  const cab = new THREE.Mesh(
    new THREE.BoxGeometry(1.5, 1.5, 1.2),
    new THREE.MeshLambertMaterial({ color: 0x1d3557 })
  );
  cab.position.set(0, 1.65, -1);
  cab.castShadow = true;
  loco.add(cab);

  const cabRoof = new THREE.Mesh(
    new THREE.BoxGeometry(1.8, 0.2, 1.5),
    new THREE.MeshLambertMaterial({ color: 0xffb703 })
  );
  cabRoof.position.set(0, 2.5, -1);
  loco.add(cabRoof);

  const chimney = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.28, 0.7, 10),
    new THREE.MeshLambertMaterial({ color: 0xffb703 })
  );
  chimney.position.set(0, 2.3, 1.35);
  loco.add(chimney);

  const nose = new THREE.Mesh(
    new THREE.CylinderGeometry(0.66, 0.66, 0.15, 14),
    new THREE.MeshLambertMaterial({ color: 0xffb703 })
  );
  nose.rotation.x = Math.PI / 2;
  nose.position.set(0, 1.45, 1.78);
  loco.add(nose);

  loco.add(makeWheel(-0.85, 1), makeWheel(0.85, 1), makeWheel(-0.85, -0.2), makeWheel(0.85, -0.2), makeWheel(-0.85, -1.3), makeWheel(0.85, -1.3));
}
train.add(loco);
scene.add(train);

const wagon = new THREE.Group();
{
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(1.5, 1.1, 2.6),
    new THREE.MeshLambertMaterial({ color: 0x2a9d8f })
  );
  body.position.y = 1.15;
  body.castShadow = true;
  wagon.add(body);
  const top = new THREE.Mesh(
    new THREE.BoxGeometry(1.7, 0.15, 2.8),
    new THREE.MeshLambertMaterial({ color: 0xffb703 })
  );
  top.position.y = 1.78;
  wagon.add(top);
  wagon.add(makeWheel(-0.8, 0.8), makeWheel(0.8, 0.8), makeWheel(-0.8, -0.8), makeWheel(0.8, -0.8));
}
scene.add(wagon);

/* Humo */
const smokePool = [];
const smokeBaseMat = new THREE.MeshLambertMaterial({ color: 0xf5f5f5, transparent: true });
for(let i = 0; i < 14; i++){
  const puff = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 6), smokeBaseMat.clone());
  puff.visible = false;
  puff.userData.life = 0;
  smokePool.push(puff);
  scene.add(puff);
}
let smokeTimer = 0;

function spawnSmoke(){
  const puff = smokePool.find(p => !p.visible);
  if(!puff) return;
  const chimneyPos = new THREE.Vector3(0, 2.6, 1.35).applyMatrix4(loco.matrixWorld);
  puff.position.copy(chimneyPos);
  puff.scale.setScalar(0.6);
  puff.material.opacity = 0.9;
  puff.userData.life = 1;
  puff.visible = true;
}

/* ---------- Movimiento ---------- */
const WAGON_GAP = 4.2 / trackLength;
let trainU = stations[Math.min(getUnlocked(), STATION_COUNT) - 1].u;
let targetU = null;
let trainSpeed = 0;
let travelDist = 0;
let traveled = 0;
let arrivalStation = null;
let autoEnterOnArrival = false; // viaje iniciado desde "Siguiente juego"

function placeOnTrack(group, u){
  const p = trackCurve.getPointAt(u);
  const ahead = trackCurve.getPointAt((u + 0.004) % 1);
  group.position.set(p.x, 0.2, p.z);
  group.lookAt(ahead.x, 0.2, ahead.z);
}

function trainAtStation(idx){
  return targetU === null && Math.abs((((stations[idx].u - trainU) % 1) + 1) % 1) < 0.005;
}

function sendTrainTo(stationIdx){
  let dist = stations[stationIdx].u - trainU;
  if(dist <= 0.0001) dist += 1;
  targetU = stations[stationIdx].u;
  travelDist = dist;
  traveled = 0;
  arrivalStation = stations[stationIdx];
  showHint('🚂 ¡El tren va en camino a ' + GAMES[stationIdx].title + '!');
}

/* ============================================================
   CAMARA
   ============================================================ */
let azimuth = Math.PI * 0.25;
let camDist = 58;
let autoRotate = true;
let followBlend = 0;
const camTarget = new THREE.Vector3(0, 0, 0);
const camPos = new THREE.Vector3();

function updateCamera(dt){
  const moving = targetU !== null;
  followBlend += ((moving ? 1 : 0) - followBlend) * Math.min(1, dt * 1.6);

  if(autoRotate && !moving) azimuth += dt * 0.04;

  const overviewPos = new THREE.Vector3(
    Math.cos(azimuth) * camDist,
    camDist * 0.62,
    Math.sin(azimuth) * camDist
  );
  const overviewTarget = new THREE.Vector3(0, 0, 0);

  const trainPos = train.position.clone();
  const back = train.getWorldDirection(new THREE.Vector3()).negate();
  const followPos = trainPos.clone().add(back.multiplyScalar(14)).add(new THREE.Vector3(0, 10, 0));

  camPos.lerpVectors(overviewPos, followPos, followBlend);
  camTarget.lerpVectors(overviewTarget, trainPos, followBlend);

  camera.position.lerp(camPos, Math.min(1, dt * 3));
  camera.lookAt(camTarget);
}

let dragging = false, dragMoved = false, lastX = 0, downX = 0, downY = 0;

renderer.domElement.addEventListener('pointerdown', e => {
  dragging = true; dragMoved = false;
  lastX = downX = e.clientX; downY = e.clientY;
});
window.addEventListener('pointermove', e => {
  if(!dragging) return;
  const dx = e.clientX - lastX;
  if(Math.abs(e.clientX - downX) + Math.abs(e.clientY - downY) > 8) dragMoved = true;
  if(dragMoved){
    azimuth += dx * 0.006;
    autoRotate = false;
  }
  lastX = e.clientX;
});
window.addEventListener('pointerup', () => { dragging = false; });
renderer.domElement.addEventListener('wheel', e => {
  e.preventDefault();
  camDist = Math.max(34, Math.min(85, camDist + e.deltaY * 0.04));
}, { passive: false });

/* ============================================================
   INTERACCION
   ============================================================ */
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

function pickStation(clientX, clientY){
  pointer.x = (clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(hitMeshes);
  return hits.length ? hits[0].object.userData.stationIndex : null;
}

renderer.domElement.addEventListener('pointermove', e => {
  const idx = pickStation(e.clientX, e.clientY);
  renderer.domElement.style.cursor = idx !== null ? 'pointer' : 'grab';
});

renderer.domElement.addEventListener('pointerup', e => {
  if(dragMoved) return;
  if(targetU !== null) return; // tren en movimiento
  const idx = pickStation(e.clientX, e.clientY);
  if(idx === null) return;
  playClick();

  if(idx + 1 > getUnlocked()){
    stations[idx].shakeT = 0.6;
    showHint('🔒 Esta estación está bloqueada. ¡Completa el juego anterior!');
    return;
  }

  if(trainAtStation(idx)){
    // el tren ya esta aqui: entrar al juego
    showHint('🎮 ¡Todos a bordo! Entrando a ' + GAMES[idx].title + '...');
    setTimeout(() => { window.location.href = GAMES[idx].page; }, 350);
  } else {
    sendTrainTo(idx);
  }
});

/* ---------- Botones HUD ---------- */
document.getElementById('backHome').addEventListener('click', () => {
  window.location.href = 'bienvenida.html';
});

document.getElementById('resetProgress').addEventListener('click', () => {
  if(!confirm('¿Seguro que quieres reiniciar todo el progreso?')) return;
  localStorage.setItem('cuartoBasicoScore', '0');
  localStorage.setItem('cuartoBasicoUnlocked', '1');
  scoreEl.textContent = '0';
  refreshStations();
  showHint('Progreso reiniciado. ¡El tren te espera en la primera estación! 🚉');
});

/* ============================================================
   BUCLE PRINCIPAL
   ============================================================ */
placeOnTrack(train, trainU);
placeOnTrack(wagon, (trainU - WAGON_GAP + 1) % 1);

const clock = new THREE.Clock();
const MAX_SPEED = 20 / trackLength;

function animate(){
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  const time = clock.elapsedTime;

  if(targetU !== null){
    const remaining = travelDist - traveled;
    const easeIn = Math.min(1, traveled / (travelDist * 0.2 + 0.0001));
    const easeOut = Math.min(1, remaining / (travelDist * 0.25 + 0.0001));
    trainSpeed = MAX_SPEED * Math.max(0.22, Math.min(easeIn, easeOut));
    const step = Math.min(trainSpeed * dt, remaining);
    trainU = (trainU + step) % 1;
    traveled += step;

    wheels.forEach(w => { w.rotation.x += trainSpeed * trackLength * dt / 0.45; });

    smokeTimer -= dt;
    if(smokeTimer <= 0){ spawnSmoke(); smokeTimer = 0.18; }

    if(traveled >= travelDist - 0.00005){
      trainU = targetU;
      targetU = null;
      trainSpeed = 0;
      const idx = arrivalStation.index;
      arrivalStation = null;
      stations[idx].pulseT = 1;
      if(autoEnterOnArrival){
        autoEnterOnArrival = false;
        showHint('🎮 ¡Llegamos a ' + GAMES[idx].title + '! Entrando al juego...');
        setTimeout(() => { window.location.href = GAMES[idx].page; }, 900);
      } else {
        showHint('🚉 ¡Llegamos a ' + GAMES[idx].title + '! Haz clic en la estación para entrar al juego.');
      }
    }
  }

  placeOnTrack(train, trainU);
  placeOnTrack(wagon, (trainU - WAGON_GAP + 1) % 1);

  smokePool.forEach(p => {
    if(!p.visible) return;
    p.userData.life -= dt * 0.7;
    if(p.userData.life <= 0){ p.visible = false; return; }
    p.position.y += dt * 1.6;
    p.scale.addScalar(dt * 0.8);
    p.material.opacity = p.userData.life * 0.8;
  });

  clouds.forEach(c => {
    c.position.x += c.userData.speed * dt;
    if(c.position.x > 110) c.position.x = -110;
  });

  ducks.forEach(d => {
    d.userData.angle += dt * 0.3;
    d.position.x = -8 + Math.cos(d.userData.angle) * d.userData.radius;
    d.position.z = 6 + Math.sin(d.userData.angle) * d.userData.radius * 0.6;
    d.rotation.y = -d.userData.angle + Math.PI / 2;
  });

  stations.forEach(st => {
    st.lockGroup.position.y = 7.4 + Math.sin(time * 2 + st.index) * 0.15;
    st.lockGroup.rotation.y = Math.sin(time * 1.2 + st.index) * 0.3;
    // sacudida y pulso sobre el grupo interior (no pisa el lookAt)
    if(st.shakeT > 0){
      st.shakeT -= dt;
      st.content.rotation.z = Math.sin(st.shakeT * 40) * 0.04 * st.shakeT;
    } else {
      st.content.rotation.z = 0;
    }
    if(st.pulseT > 0){
      st.pulseT -= dt;
      const s = 1 + Math.sin((1 - st.pulseT) * Math.PI * 3) * 0.06 * st.pulseT;
      st.content.scale.setScalar(s);
    } else {
      st.content.scale.setScalar(1);
    }
    if(st.flagGroup.visible){
      st.flag.rotation.y = Math.sin(time * 3 + st.index) * 0.25;
    }
  });

  updateCamera(dt);
  renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();

setTimeout(() => {
  loading.classList.add('fade');
  setTimeout(() => loading.remove(), 700);
}, 400);

/* ¿Venimos de "Siguiente juego"? (cuarto-basico.html?viaje=N) */
const viajeParam = Number(new URLSearchParams(window.location.search).get('viaje') || '0');
if(viajeParam >= 2 && viajeParam <= STATION_COUNT && viajeParam <= getUnlocked()){
  // el tren parte desde la estacion del juego recien completado
  trainU = stations[viajeParam - 2].u;
  autoEnterOnArrival = true;
  sendTrainTo(viajeParam - 1);
} else {
  const startIdx = Math.min(getUnlocked(), STATION_COUNT) - 1;
  showHint('🚉 El tren está en ' + GAMES[startIdx].title + '. Haz clic en su estación para jugar, o elige otra.');
  setTimeout(() => hint.classList.add('hidden'), 12000);
}

})();
/* v2 */
