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
let ambientMusic = null;
let pendingAmbientStart = false;
let ambientWasPlayingBeforeCelebration = false;
let activeInstructionWord = null;
let instructionFallbackTimer = null;

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
  clearInstructionHighlight();
  speechSynthesis.cancel();
  const voice = new SpeechSynthesisUtterance(text);
  voice.lang = 'es-ES';
  voice.pitch = 1;
  voice.rate = 0.92;
  speechSynthesis.speak(voice);
}

function clearInstructionHighlight(){
  if(activeInstructionWord){
    activeInstructionWord.classList.remove('is-active');
    activeInstructionWord = null;
  }

  if(instructionFallbackTimer){
    clearTimeout(instructionFallbackTimer);
    instructionFallbackTimer = null;
  }

  if(activeGame && typeof activeGame.onInstructionCue === 'function'){
    activeGame.onInstructionCue(null);
  }
}

function highlightInstructionWord(wordElement){
  if(activeInstructionWord === wordElement) return;

  if(activeInstructionWord){
    activeInstructionWord.classList.remove('is-active');
  }

  activeInstructionWord = wordElement || null;

  if(activeInstructionWord){
    activeInstructionWord.classList.add('is-active');
  }
}

function normalizeInstructionWord(text){
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function cueInstructionWord(word){
  if(!activeGame || typeof activeGame.onInstructionCue !== 'function') return;

  activeGame.onInstructionCue(normalizeInstructionWord(word));
}

function cueInstructionPhrase(cue){
  if(!activeGame || typeof activeGame.onInstructionCue !== 'function') return;

  activeGame.onInstructionCue(cue ? normalizeInstructionWord(cue) : null);
}

function findInstructionWordByChar(words, charIndex){
  return words.find(word => charIndex >= word.start && charIndex <= word.end) || null;
}

function findInstructionWordByGlobalChar(words, charIndex){
  return words.find(word => charIndex >= word.start && charIndex < word.end) || null;
}

function getInstructionWords(){
  return [...document.querySelectorAll('.instruction-word')].map(element => ({
    element,
    text: element.dataset.word || element.textContent,
    start: Number(element.dataset.start),
    end: Number(element.dataset.end)
  }));
}

function startInstructionFallback(words){
  let index = 0;

  const advance = () => {
    const word = words[index];

    if(!word){
      clearInstructionHighlight();
      return;
    }

    highlightInstructionWord(word.element);
    cueInstructionWord(word.text);
    index++;
    instructionFallbackTimer = setTimeout(advance, 360);
  };

  advance();
}

function buildInstructionChunks(text){
  const emphasis = activeGame && Array.isArray(activeGame.instructionEmphasis)
    ? activeGame.instructionEmphasis
    : [];

  if(!emphasis.length){
    return [{
      text,
      offset: 0,
      rate: 0.92,
      holdAfter: 0,
      cue: null
    }];
  }

  const chunks = [];
  let cursor = 0;

  emphasis.forEach(item => {
    const phrase = item.text || '';
    const index = text.indexOf(phrase, cursor);

    if(!phrase || index < 0) return;

    if(index > cursor){
      chunks.push({
        text: text.slice(cursor, index),
        offset: cursor,
        rate: 0.92,
        holdAfter: 0,
        cue: null
      });
    }

    chunks.push({
      text: phrase,
      offset: index,
      rate: item.rate || 0.72,
      holdAfter: item.holdAfter || 1500,
      cue: item.cue || phrase
    });
    cursor = index + phrase.length;
  });

  if(cursor < text.length){
    chunks.push({
      text: text.slice(cursor),
      offset: cursor,
      rate: 0.92,
      holdAfter: 0,
      cue: null
    });
  }

  return chunks;
}

function speakInstructionChunks(chunks, words, index = 0){
  const chunk = chunks[index];

  if(!chunk){
    clearInstructionHighlight();
    return;
  }

  const voice = new SpeechSynthesisUtterance(chunk.text);
  let receivedBoundary = false;

  voice.lang = 'es-ES';
  voice.pitch = 1;
  voice.rate = chunk.rate;
  voice.onstart = () => {
    if(chunk.cue){
      cueInstructionPhrase(chunk.cue);
      const firstWord = findInstructionWordByGlobalChar(words, chunk.offset);
      highlightInstructionWord(firstWord ? firstWord.element : null);
    }else{
      cueInstructionPhrase(null);
    }
  };
  voice.onboundary = event => {
    if(event.name && event.name !== 'word') return;

    const word = findInstructionWordByGlobalChar(words, chunk.offset + event.charIndex);
    if(!word) return;

    receivedBoundary = true;
    highlightInstructionWord(word.element);

    if(chunk.cue){
      cueInstructionPhrase(chunk.cue);
    }else{
      cueInstructionWord(word.text);
    }
  };
  voice.onend = () => {
    if(!receivedBoundary){
      const word = findInstructionWordByGlobalChar(words, chunk.offset);
      highlightInstructionWord(word ? word.element : null);
    }

    instructionFallbackTimer = setTimeout(() => {
      if(!chunk.cue){
        clearInstructionHighlight();
      }
      speakInstructionChunks(chunks, words, index + 1);
    }, chunk.holdAfter);
  };
  voice.onerror = clearInstructionHighlight;

  speechSynthesis.speak(voice);
}

function speakInstruction(text){
  if(typeof speechSynthesis === 'undefined'){
    return;
  }

  clearInstructionHighlight();
  speechSynthesis.cancel();

  const words = getInstructionWords();
  const chunks = buildInstructionChunks(text);

  if(chunks.length > 1){
    speakInstructionChunks(chunks, words);
    return;
  }

  const voice = new SpeechSynthesisUtterance(text);
  let receivedBoundary = false;

  voice.lang = 'es-ES';
  voice.pitch = 1;
  voice.rate = 0.92;
  voice.onboundary = event => {
    if(event.name && event.name !== 'word') return;

    const word = findInstructionWordByChar(words, event.charIndex);
    if(!word) return;

    receivedBoundary = true;
    highlightInstructionWord(word.element);
    cueInstructionWord(word.text);
  };
  voice.onend = clearInstructionHighlight;
  voice.onerror = clearInstructionHighlight;

  speechSynthesis.speak(voice);

  instructionFallbackTimer = setTimeout(() => {
    if(!receivedBoundary){
      startInstructionFallback(words);
    }
  }, 700);
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
  pauseAmbientForCelebration();

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
      resumeAmbientAfterCelebration();
    }, 500);
  }, 7600);
}

function pauseAmbientForCelebration(){
  ambientWasPlayingBeforeCelebration = !!ambientMusic && !ambientMusic.paused;

  if(ambientMusic){
    ambientMusic.pause();
  }
}

function resumeAmbientAfterCelebration(){
  if(!ambientMusic || !ambientWasPlayingBeforeCelebration) return;

  ambientMusic.play().then(() => {
    pendingAmbientStart = false;
  }).catch(() => {
    pendingAmbientStart = true;
  });
}

function startAmbientMusic(src){
  if(!src) return;

  if(!ambientMusic){
    ambientMusic = document.getElementById('ambientMusic') || document.createElement('audio');
    ambientMusic.id = 'ambientMusic';
    ambientMusic.loop = true;
    ambientMusic.volume = 0.35;
    if(!ambientMusic.parentElement){
      document.body.appendChild(ambientMusic);
    }
    ambientMusic.src = src;
  }else if(!ambientMusic.src.endsWith(src)){
    ambientMusic.pause();
    ambientMusic.src = src;
    ambientMusic.currentTime = 0;
  }

  ambientMusic.play().then(() => {
    pendingAmbientStart = false;
  }).catch(() => {
    pendingAmbientStart = true;
  });
}

function resumeAmbientMusic(){
  if(!pendingAmbientStart || !ambientMusic) return;

  ambientMusic.play().then(() => {
    pendingAmbientStart = false;
  }).catch(() => {});
}

document.addEventListener('click', resumeAmbientMusic);
document.addEventListener('touchstart', resumeAmbientMusic);

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
  let match;
  let lastIndex = 0;
  const wordPattern = /[A-Za-z0-9]+/g;

  while((match = wordPattern.exec(instruction))){
    if(match.index > lastIndex){
      title.appendChild(document.createTextNode(instruction.slice(lastIndex, match.index)));
    }

    const word = document.createElement('span');
    word.className = 'instruction-word';
    word.dataset.word = match[0];
    word.dataset.start = String(match.index);
    word.dataset.end = String(match.index + match[0].length);
    word.textContent = match[0];
    title.appendChild(word);
    lastIndex = match.index + match[0].length;
  }

  if(lastIndex < instruction.length){
    title.appendChild(document.createTextNode(instruction.slice(lastIndex)));
  }

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
  startAmbientMusic(activeGame.music);
  renderShell(activeGame.instruction, activeGame.scene, activeGame.theme);
  activeGame.render();
  speakInstruction(activeGame.instruction);
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
