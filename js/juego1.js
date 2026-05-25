/* ========= IMAGENES ========= */

const fishImages = [
  'img/Catfish.webp',
  'img/pezperro.webp',
  'img/Sunfish.webp',
  'img/Axolotl.webp'
];

/* ========= ELEMENTOS ========= */

const game = document.getElementById('game');
const equationEl = document.getElementById('equation');
const caughtEl = document.getElementById('caught');
const timerEl = document.getElementById('timer');
const scoreEl = document.getElementById('score');
const streakEl = document.getElementById('streak');
const livesEl = document.getElementById('lives');
const verifyBtn = document.getElementById('verifyBtn');
const releaseBtn = document.getElementById('releaseBtn');
const newRoundBtn = document.getElementById('newRoundBtn');
const backBtn = document.getElementById('backBtn');
const messageEl = document.getElementById('message');
const roundHint = document.getElementById('roundHint');
const difficultyButtons = document.querySelectorAll('.difficulty-btn');

/* ========= VARIABLES ========= */

let target = 0;
let caught = 0;
let score = 0;
let streak = 0;
let lives = 3;
let fishCount = 10;
let fishSpeed = 1.2;
let difficulty = 'easy';
let roundLocked = false;

let timer;
let timeLeft = 0;
let fishIntervals = [];

const sounds = {
  catch: new Audio('sonidos/click.mp3'),
  correct: new Audio('sonidos/confetiburbuja.mp3')
};

Object.values(sounds).forEach(sound => {
  sound.volume = 0.45;
});

/* ========= USUARIO ========= */

function loadUser(){
  const nombre = localStorage.getItem('nombreUsuario');
  const avatar = localStorage.getItem('avatarSeleccionado');

  const avatarMap = {
    avatar1: 'alce.png',
    avatar2: 'leon.png',
    avatar3: 'rana.png',
    avatar4: 'tigre.png'
  };

  const avatarEl = document.getElementById('avatarUsuario');
  const nombreEl = document.getElementById('nombreUsuario');

  if(avatarEl){
    if(avatar && avatarMap[avatar]){
      avatarEl.src = 'img/' + avatarMap[avatar];
      avatarEl.style.display = '';
    }else if(nombre){
      avatarEl.src = 'img/alce.png';
      avatarEl.style.display = '';
    }else{
      avatarEl.style.display = 'none';
    }
  }

  if(nombreEl){
    nombreEl.textContent = nombre || '';
  }
}

/* ========= VOZ ========= */

function speak(text){
  if(typeof speechSynthesis === 'undefined') return;

  speechSynthesis.cancel();

  const voice = new SpeechSynthesisUtterance(text);
  voice.lang = 'es-ES';
  voice.pitch = 0.95;
  voice.rate = 0.95;
  voice.volume = 1;

  speechSynthesis.speak(voice);
}

function speakNumber(number){
  speak(number.toString());
}

function playSound(name){
  const sound = sounds[name];
  if(!sound) return;

  sound.currentTime = 0;
  sound.play().catch(() => {});
}

/* ========= DIFICULTAD ========= */

function setDifficulty(level){
  difficulty = level;

  if(level === 'easy'){
    fishCount = 8;
    fishSpeed = 1.05;
    lives = 3;
  }

  if(level === 'medium'){
    fishCount = 12;
    fishSpeed = 1.45;
    lives = 3;
  }

  if(level === 'hard'){
    fishCount = 14;
    fishSpeed = 2;
    lives = 2;
  }

  difficultyButtons.forEach(button => {
    button.classList.toggle(
      'active',
      button.dataset.level === level
    );
  });

  livesEl.innerText = lives;
  startRound();
}

/* ========= RANDOM ========= */

function random(min,max){
  return Math.floor(Math.random()*(max-min)+min);
}

/* ========= ECUACIONES ========= */

function generateEquation(){
  let a;
  let b;

  if(difficulty === 'easy'){
    a = random(1,6);
    b = random(1,5);
  }else if(difficulty === 'medium'){
    a = random(3,9);
    b = random(1,8);
  }else{
    a = random(5,12);
    b = random(1,10);
  }

  const type = Math.random() > 0.48 ? '+' : '-';

  if(type === '+'){
    target = a + b;
  }else{
    if(a < b){
      [a,b] = [b,a];
    }

    target = a - b;
  }

  equationEl.textContent = `${a} ${type} ${b}`;
  roundHint.textContent = 'Calcula la operación, pesca tu respuesta y presiona verificar.';
}

/* ========= PECES ========= */

function clearFish(){
  fishIntervals.forEach(interval => clearInterval(interval));
  fishIntervals = [];
  document.querySelectorAll('.fish').forEach(fish => fish.remove());
}

function createFish(){
  clearFish();

  const totalFish = Math.max(fishCount, target + 3);

  for(let i = 0; i < totalFish; i++){
    const fish = document.createElement('div');
    fish.className = 'fish';

    const img = document.createElement('img');
    img.src = fishImages[random(0, fishImages.length)];
    img.alt = 'Pez';

    fish.appendChild(img);

    fish.style.left = random(6,86) + 'vw';
    fish.style.top = random(26,74) + 'vh';

    let dx = Math.random() > 0.5 ? 1 : -1;
    let dy = Math.random() > 0.5 ? 1 : -1;

    fish.addEventListener('click', () => catchFish(fish));

    game.appendChild(fish);

    const interval = setInterval(() => {
      if(!document.body.contains(fish)) return;

      let x = parseFloat(fish.style.left);
      let y = parseFloat(fish.style.top);

      x += dx * fishSpeed * 0.14;
      y += dy * fishSpeed * 0.08;

      if(x > 90 || x < 2){
        dx *= -1;
      }

      if(y > 78 || y < 24){
        dy *= -1;
      }

      fish.style.transform = dx < 0 ? 'scaleX(-1)' : 'scaleX(1)';
      fish.style.left = x + 'vw';
      fish.style.top = y + 'vh';
    }, 30);

    fishIntervals.push(interval);
  }
}

function catchFish(fish){
  if(roundLocked || fish.classList.contains('caught')) return;

  fish.classList.add('caught');
  caught++;
  caughtEl.innerText = caught;

  playSound('catch');
  createSplash(fish.style.left, fish.style.top);
  speakNumber(caught);
  popText('+1', fish.style.left, fish.style.top);

  setTimeout(() => fish.remove(), 320);

  roundHint.textContent = 'Cuando creas que tienes la cantidad correcta, presiona verificar.';
}

function releaseFish(){
  if(roundLocked || caught <= 0) return;

  caught--;
  caughtEl.innerText = caught;

  roundHint.textContent = 'Soltaste un pez. Revisa tu cuenta antes de verificar.';

  popText('-1', '50vw', '58vh');
  speak('Soltaste un pez');
}

/* ========= VERIFICAR ========= */

function verifyAnswer(){
  if(roundLocked) return;

  roundLocked = true;
  clearInterval(timer);

  if(caught === target){
    const gained = 10 + (streak * 2) + (difficulty === 'hard' ? 6 : 0);

    score += gained;
    streak++;

    scoreEl.innerText = score;
    streakEl.innerText = streak;

    showMessage(`¡Correcto! +${gained}`);
    playSound('correct');
    createConfetti();
    speak(randomPraise());

    setTimeout(startRound, 1600);
    return;
  }

  streak = 0;
  lives--;

  streakEl.innerText = streak;
  livesEl.innerText = Math.max(lives, 0);

  const hint = caught < target
    ? `Faltaron ${target - caught} peces.`
    : `Te sobraron ${caught - target} peces.`;

  showMessage(hint);
  speak(hint);
  game.classList.add('screen-shake');
  setTimeout(() => game.classList.remove('screen-shake'), 300);

  if(lives <= 0){
    setTimeout(resetGame, 1700);
  }else{
    setTimeout(startRound, 1700);
  }
}

function resetGame(){
  score = 0;
  streak = 0;
  lives = difficulty === 'hard' ? 2 : 3;

  scoreEl.innerText = score;
  streakEl.innerText = streak;
  livesEl.innerText = lives;

  showMessage('Nueva partida');
  speak('Nueva partida');
  startRound();
}

/* ========= MENSAJES ========= */

function randomPraise(){
  const praises = [
    'Excelente trabajo',
    'Muy bien hecho',
    'Fantástico',
    'Buen trabajo pescador',
    'Lo estás haciendo genial'
  ];

  return praises[random(0,praises.length)];
}

function showMessage(text){
  messageEl.textContent = text;
  messageEl.style.display = 'block';

  clearTimeout(window.messageTimeout);
  window.messageTimeout = setTimeout(() => {
    messageEl.style.display = 'none';
  }, 1200);
}

function popText(text,x,y){
  const pop = document.createElement('div');

  pop.className = 'pop';
  pop.textContent = text;
  pop.style.left = x;
  pop.style.top = y;

  game.appendChild(pop);

  setTimeout(() => {
    pop.remove();
  }, 1000);
}

function createSplash(x,y){
  const splash = document.createElement('div');

  splash.className = 'splash';
  splash.style.left = x;
  splash.style.top = y;

  game.appendChild(splash);

  setTimeout(() => {
    splash.remove();
  }, 650);
}

function createConfetti(){
  for(let i = 0; i < 28; i++){
    const confetti = document.createElement('div');

    confetti.className = 'confetti-piece';
    confetti.style.left = Math.random() * 100 + 'vw';
    confetti.style.background = `hsl(${Math.random() * 360}, 95%, 64%)`;
    confetti.style.animationDelay = Math.random() * 0.35 + 's';

    document.body.appendChild(confetti);

    setTimeout(() => {
      confetti.remove();
    }, 2200);
  }
}

/* ========= TIMER ========= */

function startTimer(){
  clearInterval(timer);

  if(difficulty !== 'hard'){
    timerEl.innerText = '--';
    verifyBtn.style.display = 'inline-flex';
    return;
  }

  verifyBtn.style.display = 'inline-flex';
  timeLeft = 10;
  timerEl.innerText = timeLeft;

  timer = setInterval(() => {
    timeLeft--;
    timerEl.innerText = timeLeft;

    if(timeLeft <= 0){
      clearInterval(timer);
      verifyAnswer();
    }
  }, 1000);
}

/* ========= BURBUJAS ========= */

function createBubbles(){
  setInterval(() => {
    const bubble = document.createElement('div');
    const size = random(10,35);

    bubble.className = 'bubble';
    bubble.style.width = size + 'px';
    bubble.style.height = size + 'px';
    bubble.style.left = random(0,100) + 'vw';
    bubble.style.animationDuration = random(5,12) + 's';

    game.appendChild(bubble);

    setTimeout(() => {
      bubble.remove();
    }, 12000);
  }, 500);
}

/* ========= START ========= */

function startRound(){
  roundLocked = false;
  caught = 0;

  caughtEl.innerText = caught;

  generateEquation();
  createFish();
  startTimer();
}

/* ========= EVENTOS ========= */

function bindEvents(){
  difficultyButtons.forEach(button => {
    button.addEventListener('click', () => {
      setDifficulty(button.dataset.level);
    });
  });

  verifyBtn.addEventListener('click', () => verifyAnswer());
  releaseBtn.addEventListener('click', releaseFish);
  newRoundBtn.addEventListener('click', startRound);
  backBtn.addEventListener('click', () => {
    window.location.href = 'aprende1.html';
  });
}

setTimeout(() => {
  if(!player && typeof YT !== 'undefined' && YT && YT.Player){
    onYouTubeIframeAPIReady();
  }
}, 1200);

loadUser();
bindEvents();
createBubbles();
setDifficulty('easy');