/* ========= IMAGENES ========= */

const fishImages = [
  'img/Catfish.webp',
  'img/pezperro.webp',
  'img/Sunfish.webp',
  'img/Axolotl.webp'
];

/* ========= ELEMENTOS ========= */

const game = document.getElementById('game');
const topbar = document.querySelector('.topbar');
const difficultyMenu = document.getElementById('difficultyMenu');
const completeOverlay = document.getElementById('completeOverlay');
const aquarium = document.getElementById('aquarium');
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
const menuBackBtn = document.getElementById('menuBackBtn');
const messageEl = document.getElementById('message');
const roundHint = document.getElementById('roundHint');
const unlockHint = document.getElementById('unlockHint');
const difficultyButtons = document.querySelectorAll('.difficulty-btn');
const musicBtn = document.getElementById('musicBtn');
const gameMusic = document.getElementById('gameMusic');
gameMusic.volume = 0.35;

/* ========= VARIABLES ========= */

let target = 0;
let caught = 0;
let score = 0;
let streak = 0;
let lives = 3;
let fishCount = 10;
let fishSpeed = 1.2;
let difficulty = 'easy';
let roundLocked = true;
let operationsCompleted = 0;
let gameStarted = false;

let timer;
let timeLeft = 0;
let fishIntervals = [];
let capturedFish = [];
let draggedFish = null;

const difficultyOrder = ['easy', 'medium', 'hard', 'infinite'];
const difficultyLabels = {
  easy: 'Modo fácil',
  medium: 'Normal',
  hard: 'Difícil',
  infinite: 'Infinito'
};

const sounds = {
  catch: new Audio('sonidos/click.mp3'),
  correct: new Audio('sonidos/confetiburbuja.mp3')
};

Object.values(sounds).forEach(sound => {
  sound.volume = 0.45;
});

/* ========= MUSICA ========= */

let isMusicPlaying = false;

function toggleMusic(){
  if(isMusicPlaying){
    gameMusic.pause();
    musicBtn.classList.add('inactive');
    isMusicPlaying = false;
  }else{
    gameMusic.play().catch(() => {});
    musicBtn.classList.remove('inactive');
    isMusicPlaying = true;
  }
}

musicBtn.addEventListener('click', toggleMusic);
musicBtn.classList.add('inactive');

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

function isFiniteMode(){
  return difficulty !== 'infinite';
}

function getDifficultyKey(level){
  return `juego_dificultad_${level}_completada`;
}

function isDifficultyCompleted(level){
  return localStorage.getItem(getDifficultyKey(level)) === 'true';
}

function isDifficultyUnlocked(level){
  const index = difficultyOrder.indexOf(level);
  if(index <= 0){
    return true;
  }

  return isDifficultyCompleted(difficultyOrder[index - 1]);
}

function saveDifficultyCompletion(level){
  if(level === 'infinite'){
    return;
  }

  localStorage.setItem(getDifficultyKey(level), 'true');
}

function updateDifficultyLocks(){
  difficultyButtons.forEach(button => {
    const level = button.dataset.level;
    const unlocked = isDifficultyUnlocked(level);
    const completed = isDifficultyCompleted(level);
    const label = difficultyLabels[level] || button.textContent.trim();

    button.disabled = !unlocked;
    button.classList.toggle('locked', !unlocked);
    button.classList.toggle('completed', completed);
    button.innerHTML = `${label}<span>${unlocked ? (completed ? '✓' : '') : '🔒'}</span>`;
    button.setAttribute(
      'aria-label',
      unlocked ? label : `${label} bloqueado`
    );
  });

  if(unlockHint){
    unlockHint.textContent = 'Completa 3 preguntas para desbloquear la siguiente dificultad.';
  }
}

function updateModeUI(){
  if(topbar){
    topbar.classList.toggle('finite-mode', isFiniteMode());
  }

  if(newRoundBtn){
    newRoundBtn.style.display = isFiniteMode() ? 'none' : 'inline-flex';
  }
}

function hideDifficultyMenu(){
  if(difficultyMenu){
    difficultyMenu.classList.add('hidden');
  }
}

function showDifficultyMenu(){
  gameStarted = false;
  roundLocked = true;
  operationsCompleted = 0;
  caught = 0;
  clearInterval(timer);
  clearFish();

  caughtEl.innerText = '0';
  timerEl.innerText = '--';
  equationEl.textContent = '?';
  roundHint.textContent = 'Elige una dificultad para comenzar.';

  if(messageEl){
    messageEl.style.display = 'none';
  }

  if(completeOverlay){
    completeOverlay.classList.remove('show');
  }

  if(difficultyMenu){
    updateDifficultyLocks();
    difficultyMenu.classList.remove('hidden');
  }
}

function setDifficulty(level){
  if(!isDifficultyUnlocked(level)){
    showMessage('Completa la dificultad anterior primero.');
    speak('Completa la dificultad anterior primero.');
    return;
  }

  difficulty = level;
  gameStarted = true;
  operationsCompleted = 0;
  score = 0;
  streak = 0;

  if(level === 'easy'){
    fishCount = 8;
    fishSpeed = 1.05;
    lives = 1;
  }

  if(level === 'medium'){
    fishCount = 12;
    fishSpeed = 1.45;
    lives = 1;
  }

  if(level === 'hard'){
    fishCount = 14;
    fishSpeed = 2;
    lives = 1;
  }

  if(level === 'infinite'){
    fishCount = 14;
    fishSpeed = 1.75;
    lives = 3;
  }

  difficultyButtons.forEach(button => {
    button.classList.toggle('active', button.dataset.level === level);
  });

  scoreEl.innerText = score;
  streakEl.innerText = streak;
  livesEl.innerText = lives;
  updateModeUI();
  hideDifficultyMenu();
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
  }else if(difficulty === 'hard'){
    a = random(5,12);
    b = random(1,10);
  }else{
    a = random(2,13);
    b = random(1,12);
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
  roundHint.textContent = isFiniteMode()
    ? `Pregunta ${operationsCompleted + 1} de 3: arrastra tu respuesta a la pecera y presiona verificar.`
    : 'Calcula la operación, arrastra tu respuesta a la pecera y presiona verificar.';
}

/* ========= PECES ========= */

function clearFish(){
  fishIntervals.forEach(interval => clearInterval(interval));
  fishIntervals = [];
  capturedFish = [];
  document.querySelectorAll('.fish').forEach(fish => fish.remove());
  document.querySelectorAll('.aquarium-fish').forEach(fish => fish.remove());
}

function removeFishInterval(fish){
  if(!fish || !fish.swimInterval) return;

  clearInterval(fish.swimInterval);
  fishIntervals = fishIntervals.filter(interval => interval !== fish.swimInterval);
  fish.swimInterval = null;
}

function startFishSwim(fish){
  let dx = fish.swimDirectionX || (Math.random() > 0.5 ? 1 : -1);
  let dy = fish.swimDirectionY || (Math.random() > 0.5 ? 1 : -1);

  fish.swimDirectionX = dx;
  fish.swimDirectionY = dy;

  removeFishInterval(fish);

  const interval = setInterval(() => {
    if(!document.body.contains(fish) || fish.classList.contains('dragging')) return;

    let x = parseFloat(fish.style.left);
    let y = parseFloat(fish.style.top);

    x += dx * fishSpeed * 0.14;
    y += dy * fishSpeed * 0.08;

    if(x > 90 || x < 2){
      dx *= -1;
      fish.swimDirectionX = dx;
    }

    if(y > 78 || y < 24){
      dy *= -1;
      fish.swimDirectionY = dy;
    }

    fish.style.transform = dx < 0 ? 'scaleX(-1)' : 'scaleX(1)';
    fish.style.left = x + 'vw';
    fish.style.top = y + 'vh';
  }, 30);

  fish.swimInterval = interval;
  fishIntervals.push(interval);
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

    fish.addEventListener('pointerdown', startDragFish);

    game.appendChild(fish);
    startFishSwim(fish);
  }
}

function startDragFish(event){
  const fish = event.currentTarget;
  if(roundLocked || !gameStarted || fish.classList.contains('caught')) return;

  event.preventDefault();
  removeFishInterval(fish);

  const rect = fish.getBoundingClientRect();
  draggedFish = {
    fish,
    offsetX: event.clientX - rect.left,
    offsetY: event.clientY - rect.top,
    originalLeft: fish.style.left,
    originalTop: fish.style.top
  };

  fish.classList.add('dragging');
  fish.style.left = rect.left + 'px';
  fish.style.top = rect.top + 'px';
  fish.style.transform = '';

  document.addEventListener('pointermove', dragFish);
  document.addEventListener('pointerup', dropFish, { once:true });
}

function dragFish(event){
  if(!draggedFish) return;

  const { fish, offsetX, offsetY } = draggedFish;
  fish.style.left = (event.clientX - offsetX) + 'px';
  fish.style.top = (event.clientY - offsetY) + 'px';

  if(aquarium){
    aquarium.classList.toggle('drag-over', isPointInsideAquarium(event.clientX, event.clientY));
  }
}

function dropFish(event){
  if(!draggedFish) return;

  document.removeEventListener('pointermove', dragFish);

  const { fish, originalLeft, originalTop } = draggedFish;
  const droppedInAquarium = isPointInsideAquarium(event.clientX, event.clientY);

  if(aquarium){
    aquarium.classList.remove('drag-over');
  }

  fish.classList.remove('dragging');

  if(droppedInAquarium){
    catchFish(fish);
  }else{
    fish.style.left = originalLeft;
    fish.style.top = originalTop;
    startFishSwim(fish);
  }

  draggedFish = null;
}

function isPointInsideAquarium(x,y){
  if(!aquarium) return false;

  const rect = aquarium.getBoundingClientRect();
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
}

function catchFish(fish){
  if(roundLocked || !gameStarted || fish.classList.contains('caught')) return;

  removeFishInterval(fish);
  fish.classList.add('caught');
  caught++;
  caughtEl.innerText = caught;

  const center = getAquariumCenter();
  playSound('catch');
  createSplash(center.x, center.y);
  speakNumber(caught);
  popText('+1', center.x, center.y);

  placeFishInAquarium(fish);

  roundHint.textContent = 'El pez quedó en la pecera. Sigue arrastrando hasta tener la respuesta.';
}

function getAquariumCenter(){
  if(!aquarium){
    return { x:'76vw', y:'68vh' };
  }

  const rect = aquarium.getBoundingClientRect();
  return {
    x: (rect.left + rect.width / 2) + 'px',
    y: (rect.top + rect.height / 2) + 'px'
  };
}

function placeFishInAquarium(fish){
  if(!aquarium){
    fish.remove();
    return;
  }

  fish.className = 'aquarium-fish';
  fish.style.left = random(12,72) + '%';
  fish.style.top = random(30,66) + '%';
  fish.style.transform = Math.random() > 0.5 ? 'scaleX(-1)' : 'scaleX(1)';
  fish.style.animation = 'none';
  fish.removeEventListener('pointerdown', startDragFish);

  aquarium.appendChild(fish);
  capturedFish.push(fish);
}

function releaseFish(){
  if(roundLocked || !gameStarted || caught <= 0) return;

  caught--;
  caughtEl.innerText = caught;
  const fish = capturedFish.pop();
  if(fish){
    fish.remove();
  }

  roundHint.textContent = 'Soltaste un pez. Revisa tu cuenta antes de verificar.';

  popText('-1', '50vw', '58vh');
  speak('Soltaste un pez');
}

/* ========= VERIFICAR ========= */

function verifyAnswer(){
  if(roundLocked || !gameStarted) return;

  roundLocked = true;
  clearInterval(timer);

  if(caught === target){
    const gained = 10 + (streak * 2) + (difficulty === 'hard' ? 6 : 0);

    score += gained;
    streak++;
    operationsCompleted++;

    if(!isFiniteMode()){
      scoreEl.innerText = score;
      streakEl.innerText = streak;
    }

    showMessage(isFiniteMode() ? `¡Correcto! ${operationsCompleted}/3` : `¡Correcto! +${gained}`);
    playSound('correct');
    createConfetti();
    speak(randomPraise());

    if(isFiniteMode() && operationsCompleted >= 3){
      setTimeout(completeGame, 1600);
    }else{
      setTimeout(startRound, 1600);
    }
    return;
  }

  streak = 0;
  lives--;

  if(!isFiniteMode()){
    streakEl.innerText = streak;
    livesEl.innerText = Math.max(lives, 0);
  }

  const hint = caught < target
    ? `Faltaron ${target - caught} peces.`
    : `Te sobraron ${caught - target} peces.`;

  const resetText = isFiniteMode()
    ? `${hint} Se reinician las preguntas.`
    : hint;

  showMessage(resetText);
  speak(resetText);
  game.classList.add('screen-shake');
  setTimeout(() => game.classList.remove('screen-shake'), 300);

  if(isFiniteMode()){
    operationsCompleted = 0;
    setTimeout(startRound, 1900);
  }else if(lives <= 0){
    setTimeout(resetGame, 1700);
  }else{
    setTimeout(startRound, 1700);
  }
}

function completeGame(){
  clearFish();
  roundLocked = true;
  saveDifficultyCompletion(difficulty);

  speak('Felicidades, has completado las tres preguntas');
  createConfetti();

  if(completeOverlay){
    completeOverlay.classList.add('show');
  }

  setTimeout(() => {
    showDifficultyMenu();
  }, 4200);
}

function resetGame(){
  operationsCompleted = 0;
  score = 0;
  streak = 0;
  lives = difficulty === 'infinite' ? 3 : 1;

  scoreEl.innerText = score;
  streakEl.innerText = streak;
  livesEl.innerText = lives;

  showMessage(isFiniteMode() ? 'Preguntas reiniciadas' : 'Nueva partida');
  speak(isFiniteMode() ? 'Preguntas reiniciadas' : 'Nueva partida');
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
  if(!gameStarted) return;

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
      if(button.disabled){
        showMessage('Completa la dificultad anterior primero.');
        speak('Completa la dificultad anterior primero.');
        return;
      }

      setDifficulty(button.dataset.level);
    });
  });

  verifyBtn.addEventListener('click', () => verifyAnswer());
  releaseBtn.addEventListener('click', releaseFish);
  newRoundBtn.addEventListener('click', startRound);
  backBtn.addEventListener('click', showDifficultyMenu);

  if(menuBackBtn){
    menuBackBtn.addEventListener('click', () => {
      window.location.href = 'aprende1.html';
    });
  }
}

loadUser();
bindEvents();
createBubbles();
showDifficultyMenu();
