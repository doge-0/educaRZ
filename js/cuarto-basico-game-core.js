const board = document.getElementById('activityBoard');
const scoreEl = document.getElementById('score');
const feedback = document.getElementById('feedback');
const gameStep = document.getElementById('gameStep');
const gameTitle = document.getElementById('gameTitle');
const studentGoal = document.getElementById('studentGoal');
const restartBtn = document.getElementById('restartBtn');
const verifyBtn = document.getElementById('verifyBtn');
const selectBtn = document.getElementById('selectBtn');
const nextBtn = document.getElementById('nextBtn');
const backMenu = document.getElementById('backMenu');

let completedCurrent = false;
let dragging = null;
let activeGame = null;

function getScore(){
  return Number(localStorage.getItem('cuartoBasicoScore') || '0');
}

function setScore(value){
  localStorage.setItem('cuartoBasicoScore', String(Math.max(0, value)));
  scoreEl.textContent = Math.max(0, value);
}

function getUnlocked(){
  return Number(localStorage.getItem('cuartoBasicoUnlocked') || '1');
}

function setUnlocked(value){
  localStorage.setItem('cuartoBasicoUnlocked', String(Math.max(getUnlocked(), value)));
}

function speak(text){
  if(typeof speechSynthesis === 'undefined') return;
  speechSynthesis.cancel();
  const voice = new SpeechSynthesisUtterance(text);
  voice.lang = 'es-ES';
  voice.pitch = 1;
  voice.rate = 0.92;
  speechSynthesis.speak(voice);
}

function praise(){
  const texts = ['Muy bien', 'Correcto', 'Excelente trabajo', 'Lo lograste'];
  speak(texts[Math.floor(Math.random() * texts.length)]);
}

function showFeedback(text, type){
  feedback.textContent = text;
  feedback.className = `feedback ${type}`;
  clearTimeout(window.feedbackTimer);
  window.feedbackTimer = setTimeout(() => {
    feedback.className = 'feedback';
  }, 900);
}

function createConfetti(){
  for(let i = 0; i < 45; i++){
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left = Math.random() * 100 + 'vw';
    piece.style.background = `hsl(${Math.random() * 360}, 95%, 62%)`;
    piece.style.animationDelay = Math.random() * 0.45 + 's';
    document.body.appendChild(piece);
    setTimeout(() => piece.remove(), 2600);
  }
}

function showVictoryDancers(){
  document.querySelector('.victory-dancers')?.remove();

  const wrap = document.createElement('div');
  wrap.className = 'victory-dancers';
  wrap.innerHTML = `
    <img class="victory-dancer victory-dancer-left" src="img/Mart.gif" alt="Mart celebrando">
    <img class="victory-dancer victory-dancer-right" src="img/Teledancer.gif" alt="Teledancer celebrando">
  `;
  document.body.appendChild(wrap);

  const audio = new Audio('sonidos/Teledancer2.mp3');
  audio.volume = 0.85;
  audio.play().catch(() => {});

  setTimeout(() => {
    wrap.classList.add('is-leaving');
    setTimeout(() => {
      audio.pause();
      audio.currentTime = 0;
      wrap.remove();
    }, 500);
  }, 7600);
}

function shuffle(items){
  return [...items].sort(() => Math.random() - 0.5);
}

function randomInt(min, max){
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function formatNumber(number){
  return number.toLocaleString('es-CL');
}

function uniqueRandomNumbers(count, min, max, minGap = 1){
  const numbers = [];

  while(numbers.length < count){
    const value = randomInt(min, max);
    const repeated = numbers.includes(value);
    const tooClose = numbers.some(number => Math.abs(number - value) < minGap);

    if(!repeated && !tooClose){
      numbers.push(value);
    }
  }

  return numbers;
}

function splitDigits(number){
  return String(number).padStart(4, '0').split('');
}

function makeBank(items){
  const bank = document.createElement('div');
  bank.className = 'drag-bank';
  bank.dataset.bank = 'true';
  shuffle(items).forEach(item => bank.appendChild(makeDraggable(item)));
  return bank;
}

function makeDraggable(item){
  const element = document.createElement('button');
  element.type = 'button';
  element.className = item.className ? `draggable ${item.className}` : 'draggable';
  element.dataset.value = item.value;
  element.dataset.speak = item.speak || item.label;
  element.innerHTML = item.html || item.label;
  element.addEventListener('pointerdown', startDrag);
  element.addEventListener('click', () => speak(element.dataset.speak));
  return element;
}

function makeZone(label, answer, className = ''){
  const zone = document.createElement('div');
  zone.className = className ? `drop-zone ${className}` : 'drop-zone';
  zone.dataset.answer = answer;
  zone.textContent = label;
  return zone;
}

function resetElementStyle(element){
  element.classList.remove('dragging');
  element.style.left = '';
  element.style.top = '';
  element.style.width = '';
}

function startDrag(event){
  if(completedCurrent) return;

  const element = event.currentTarget;
  const rect = element.getBoundingClientRect();
  speak(element.dataset.speak);

  dragging = {
    element,
    parent: element.parentElement,
    next: element.nextSibling,
    offsetX: event.clientX - rect.left,
    offsetY: event.clientY - rect.top
  };

  element.setPointerCapture(event.pointerId);
  element.classList.add('dragging');
  element.style.width = rect.width + 'px';
  element.style.left = rect.left + 'px';
  element.style.top = rect.top + 'px';

  document.addEventListener('pointermove', moveDrag);
  document.addEventListener('pointerup', endDrag, { once: true });
}

function moveDrag(event){
  if(!dragging) return;
  const { element, offsetX, offsetY } = dragging;
  element.style.left = (event.clientX - offsetX) + 'px';
  element.style.top = (event.clientY - offsetY) + 'px';

  document.querySelectorAll('.drop-zone').forEach(zone => zone.classList.remove('over'));
  const zone = getDropTarget(event.clientX, event.clientY);
  if(zone && zone.classList.contains('drop-zone')){
    zone.classList.add('over');
  }
}

function endDrag(event){
  if(!dragging) return;

  document.removeEventListener('pointermove', moveDrag);
  document.querySelectorAll('.drop-zone').forEach(zone => zone.classList.remove('over'));

  const target = getDropTarget(event.clientX, event.clientY);
  const { element, parent, next } = dragging;

  if(target && target.classList.contains('drop-zone')){
    const oldItem = target.querySelector('.draggable');
    if(oldItem && oldItem !== element){
      document.querySelector('.drag-bank').appendChild(oldItem);
    }
    target.textContent = '';
    target.appendChild(element);
  }else if(target && target.classList.contains('drag-bank')){
    target.appendChild(element);
  }else if(parent){
    parent.insertBefore(element, next);
  }

  resetElementStyle(element);
  dragging = null;
}

function getDropTarget(x, y){
  if(dragging){
    dragging.element.style.pointerEvents = 'none';
  }
  const target = document.elementFromPoint(x, y);
  if(dragging){
    dragging.element.style.pointerEvents = '';
  }
  return target ? target.closest('.drop-zone, .drag-bank') : null;
}

function renderShell(instruction, themeLabel, theme){
  board.innerHTML = '';
  board.className = `activity-board theme-${theme}`;
  const scene = document.createElement('div');
  scene.className = 'theme-scene';
  scene.textContent = themeLabel;
  board.appendChild(scene);
  const title = document.createElement('p');
  title.className = 'instruction';
  title.textContent = instruction;
  board.appendChild(title);
}

function validateBoard(){
  const zones = [...document.querySelectorAll('.drop-zone[data-answer]')];
  const allAnswered = zones.every(zone => zone.querySelector('.draggable'));
  if(!allAnswered){
    return false;
  }

  return zones.every(zone => {
    const item = zone.querySelector('.draggable');
    return item && item.dataset.value === zone.dataset.answer;
  });
}

function markCorrect(){
  completedCurrent = true;
  const gained = 100 + activeGame.number * 15;
  setScore(getScore() + gained);
  setUnlocked(activeGame.number + 1);
  praise();
  createConfetti();
  showVictoryDancers();
  showFeedback(`¡Correcto! Ganaste ${gained} puntos.`, 'good');
  nextBtn.disabled = false;
  verifyBtn.disabled = true;
}

function markIncorrect(){
  const penalty = 25;
  setScore(getScore() - penalty);
  speak('Intentalo nuevamente');
  showFeedback(`Intentalo nuevamente. Se restaron ${penalty} puntos.`, 'bad');
  document.querySelector('.game-shell').classList.add('screen-shake');
  setTimeout(() => document.querySelector('.game-shell').classList.remove('screen-shake'), 380);
}

function loadGame(){
  if(activeGame.number > getUnlocked()){
    window.location.href = 'cuarto-basico.html';
    return;
  }

  completedCurrent = false;
  verifyBtn.disabled = false;
  nextBtn.disabled = true;
  feedback.textContent = '';
  feedback.className = 'feedback';
  scoreEl.textContent = getScore();
  gameStep.textContent = `Juego ${activeGame.number} de 6`;
  gameTitle.textContent = activeGame.title;
  studentGoal.textContent = activeGame.goal;
  renderShell(activeGame.instruction, activeGame.scene, activeGame.theme);
  activeGame.render();
  speak(activeGame.instruction);
}

function startSingleGame(game){
  activeGame = game;
  restartBtn.addEventListener('click', loadGame);
  verifyBtn.addEventListener('click', () => {
    const isCorrect = typeof activeGame.validate === 'function'
      ? activeGame.validate()
      : validateBoard();

    if(isCorrect){
      markCorrect();
    }else{
      markIncorrect();
    }
  });
  nextBtn.addEventListener('click', () => {
    if(!completedCurrent) return;
    window.location.href = activeGame.nextPage || 'final.html';
  });
  selectBtn.addEventListener('click', () => {
    window.location.href = 'cuarto-basico.html';
  });
  backMenu.addEventListener('click', () => {
    window.location.href = 'cuarto-basico.html';
  });
  setScore(getScore());
  loadGame();
}
