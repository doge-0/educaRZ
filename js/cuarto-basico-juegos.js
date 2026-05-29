const board = document.getElementById('activityBoard');
const scoreEl = document.getElementById('score');
const feedback = document.getElementById('feedback');
const gameStep = document.getElementById('gameStep');
const gameTitle = document.getElementById('gameTitle');
const restartBtn = document.getElementById('restartBtn');
const verifyBtn = document.getElementById('verifyBtn');
const selectBtn = document.getElementById('selectBtn');
const nextBtn = document.getElementById('nextBtn');
const backMenu = document.getElementById('backMenu');

const urlGame = Number(new URLSearchParams(window.location.search).get('juego') || '1');
let currentGame = Math.min(Math.max(urlGame, 1), 6);
let completedCurrent = false;
let dragging = null;

const gameData = [
  {
    title: 'Tienda ordenada',
    theme: 'store',
    instruction: 'Arrastra los productos desde el precio menor hasta el precio mayor. Fijate bien: algunos precios son muy parecidos.',
    render: renderStore
  },
  {
    title: 'Recta numérica',
    theme: 'line',
    instruction: 'Ubica cada número en la recta numérica, de menor a mayor. Compara millares, centenas, decenas y unidades.',
    render: renderNumberLine
  },
  {
    title: 'Tabla posicional',
    theme: 'place',
    instruction: 'Forma el número indicado poniendo cada dígito en su posición.',
    render: renderPlaceValue
  },
  {
    title: 'Mayor o menor',
    theme: 'compare',
    instruction: 'Arrastra el signo correcto en cada comparacion. Hay mas de una respuesta que resolver.',
    render: renderCompare
  },
  {
    title: 'Representaciones',
    theme: 'represent',
    instruction: 'Une cada número con su forma escrita o descompuesta. Lee con calma antes de soltar.',
    render: renderRepresentations
  },
  {
    title: 'Sudoku matemático',
    theme: 'sudoku',
    instruction: 'Completa la cuadrícula con operaciones. En cada fila, columna y bloque de 2 por 2 deben quedar 1, 2, 3 y 4 sin repetir.',
    render: renderSudoku
  }
];

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

function guardSequentialAccess(){
  const unlocked = getUnlocked();
  if(currentGame > unlocked){
    currentGame = unlocked;
    window.history.replaceState(null, '', `?juego=${currentGame}`);
  }
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

function compareSign(left, right){
  if(left > right) return '>';
  if(left < right) return '<';
  return '=';
}

function placeValueText(number){
  const [um, c, d, u] = splitDigits(number).map(Number);
  const parts = [];

  if(um) parts.push(`${um}.000`);
  if(c) parts.push(`${c}00`);
  if(d) parts.push(`${d}0`);
  if(u) parts.push(`${u}`);

  return parts.join(' + ');
}

function placeValueShort(number){
  const [um, c, d, u] = splitDigits(number);
  return `${um} UM + ${c} C + ${d} D + ${u} U`;
}

function makeOperationForResult(result, index){
  const type = index % 4;

  if(type === 0){
    const add = randomInt(1, 4);
    return `${result + add} - ${add}`;
  }

  if(type === 1){
    const add = randomInt(1, 4);
    return `${result} + ${add} - ${add}`;
  }

  if(type === 2){
    const factor = randomInt(2, 4);
    return `${result} x ${factor} ÷ ${factor}`;
  }

  const divisor = randomInt(2, 4);
  return `${result * divisor} ÷ ${divisor}`;
}

function makeSudokuSolution(){
  const base = [
    [1, 2, 3, 4],
    [3, 4, 1, 2],
    [2, 1, 4, 3],
    [4, 3, 2, 1]
  ];
  const symbols = shuffle([1, 2, 3, 4]);
  const rowOrder = [
    ...shuffle([0, 1]),
    ...shuffle([2, 3])
  ];
  const colOrder = [
    ...shuffle([0, 1]),
    ...shuffle([2, 3])
  ];

  return rowOrder.map(row => colOrder.map(col => symbols[base[row][col] - 1]));
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

function renderShell(instruction, themeLabel){
  board.innerHTML = '';
  board.className = `activity-board theme-${gameData[currentGame - 1].theme}`;
  const scene = document.createElement('div');
  scene.className = 'theme-scene';
  scene.textContent = themeLabel;
  board.appendChild(scene);
  const title = document.createElement('p');
  title.className = 'instruction';
  title.textContent = instruction;
  board.appendChild(title);
}

function renderStore(){
  renderShell(gameData[0].instruction, 'Mini tienda');
  const products = shuffle([
    ['📘', 'Cuaderno'],
    ['✏️', 'Lapices'],
    ['🧰', 'Estuche'],
    ['📏', 'Regla'],
    ['🎒', 'Mochila'],
    ['👟', 'Zapatillas'],
    ['🎧', 'Audifonos'],
    ['🧃', 'Colacion']
  ]).slice(0, 6);
  const prices = uniqueRandomNumbers(6, 1100, 9900, 35).sort((a, b) => a - b);

  board.appendChild(makeBank(products.map(([icon, name], index) => ({
    value: String(prices[index]),
    speak: `${name}, ${formatNumber(prices[index])} pesos`,
    html: `<span>${icon}</span><span>${name}<br>$${formatNumber(prices[index])}</span>`,
    className: 'store-card'
  }))));

  const row = document.createElement('div');
  row.className = 'drop-row';
  ['1 menor precio', '2', '3', '4', '5', '6 mayor precio'].forEach((label, index) => {
    row.appendChild(makeZone(label, String(prices[index])));
  });
  board.appendChild(row);
}

function renderNumberLine(){
  renderShell(gameData[1].instruction, 'Recta viajera');
  const numbers = uniqueRandomNumbers(6, 1000, 9999, 25).sort((a, b) => a - b);

  board.appendChild(makeBank(numbers.map(number => ({
    label: formatNumber(number),
    value: String(number),
    speak: formatNumber(number)
  }))));

  const line = document.createElement('div');
  line.className = 'number-line';
  ['Menor', '', '', '', '', 'Mayor'].forEach((label, index) => {
    line.appendChild(makeZone(label || 'Ubica aqui', String(numbers[index])));
  });
  board.appendChild(line);
}

function renderPlaceValue(){
  renderShell(gameData[2].instruction, 'Laboratorio posicional');
  const target = randomInt(1000, 9999);
  const digits = splitDigits(target);
  const targetLabel = document.createElement('div');
  targetLabel.className = 'target-number';
  targetLabel.innerHTML = `<span>Numero objetivo</span><strong>${formatNumber(target)}</strong>`;
  board.appendChild(targetLabel);

  const distractors = shuffle(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'])
    .filter(digit => !digits.includes(digit))
    .slice(0, 2);
  const pieces = [...digits, ...distractors].map((digit, index) => ({
    label: digit,
    value: digits.includes(digit) && index < 4 ? digit : `extra-${index}-${digit}`,
    speak: digit
  }));

  board.appendChild(makeBank(pieces));
  const table = document.createElement('div');
  table.className = 'place-table';
  [
    ['Unidad de mil', digits[0]],
    ['Centena', digits[1]],
    ['Decena', digits[2]],
    ['Unidad', digits[3]]
  ].forEach(([label, answer]) => {
    const cell = document.createElement('div');
    cell.className = 'place-cell';
    cell.innerHTML = `<strong>${label}</strong>`;
    cell.appendChild(makeZone('Digito', answer));
    table.appendChild(cell);
  });
  board.appendChild(table);
}

function renderCompare(){
  renderShell(gameData[3].instruction, 'Duelo de numeros');
  const rows = [];

  while(rows.length < 4){
    const left = randomInt(1000, 9999);
    const mode = rows.length % 4;
    let right = left;

    if(mode === 0){
      right = Math.max(1000, left - randomInt(1, 380));
    }else if(mode === 1){
      right = Math.min(9999, left + randomInt(1, 380));
    }else if(mode === 2){
      right = left;
    }else{
      right = randomInt(1000, 9999);
      if(right === left) right += right < 9999 ? 1 : -1;
    }

    rows.push([left, right, compareSign(left, right)]);
  }

  board.appendChild(makeBank(rows.map(row => ({
    label: row[2],
    value: row[2],
    speak: row[2] === '>' ? 'mayor que' : row[2] === '<' ? 'menor que' : 'igual que'
  }))));

  const wrap = document.createElement('div');
  wrap.className = 'compare-stack';
  rows.forEach(([left, right, answer]) => {
    const layout = document.createElement('div');
    layout.className = 'compare-layout';
    layout.innerHTML = `<div class="big-number">${formatNumber(left)}</div>`;
    layout.appendChild(makeZone('Signo', answer));
    layout.insertAdjacentHTML('beforeend', `<div class="big-number">${formatNumber(right)}</div>`);
    wrap.appendChild(layout);
  });
  board.appendChild(wrap);
}

function renderRepresentations(){
  renderShell(gameData[4].instruction, 'Galeria de representaciones');
  const numbers = uniqueRandomNumbers(6, 1000, 9999, 40);
  const cards = numbers.map((number, index) => ({
    label: index % 2 === 0 ? placeValueText(number) : placeValueShort(number),
    value: String(number),
    speak: formatNumber(number)
  }));

  board.appendChild(makeBank(cards));

  const grid = document.createElement('div');
  grid.className = 'match-grid';
  numbers.forEach(number => {
    const target = document.createElement('div');
    target.className = 'match-target';
    target.innerHTML = `<strong>${formatNumber(number)}</strong>`;
    target.appendChild(makeZone('Representacion', String(number)));
    grid.appendChild(target);
  });
  board.appendChild(grid);
}

function renderSudoku(){
  renderShell(gameData[5].instruction, 'Sudoku 4 x 4');
  const solution = makeSudokuSolution();
  const fixedIndexes = shuffle([0, 2, 5, 7, 8, 10, 13, 15]).slice(0, 6);
  const emptyCells = [];

  const grid = document.createElement('div');
  grid.className = 'sudoku-grid';

  solution.flat().forEach((value, index) => {
    if(fixedIndexes.includes(index)){
      const fixed = document.createElement('div');
      fixed.className = 'sudoku-cell fixed';
      fixed.textContent = value;
      fixed.addEventListener('click', () => speak(value));
      grid.appendChild(fixed);
      return;
    }

    emptyCells.push({ value, index });
    grid.appendChild(makeZone('?', String(value), 'sudoku-cell'));
  });

  const operations = emptyCells.map((cell, index) => {
    const operation = makeOperationForResult(cell.value, index);
    return {
      label: operation,
      value: String(cell.value),
      speak: operation,
      className: 'operation-card'
    };
  });

  board.appendChild(makeBank(operations));
  board.appendChild(grid);
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
  const gained = 100 + currentGame * 15;
  setScore(getScore() + gained);
  setUnlocked(currentGame + 1);
  praise();
  createConfetti();
  showFeedback(`¡Correcto! Ganaste ${gained} puntos.`, 'good');
  nextBtn.disabled = false;
  verifyBtn.disabled = true;
}

function markIncorrect(){
  const penalty = 25;
  setScore(getScore() - penalty);
  speak('Inténtalo nuevamente');
  showFeedback(`Inténtalo nuevamente. Se restaron ${penalty} puntos.`, 'bad');
  document.querySelector('.game-shell').classList.add('screen-shake');
  setTimeout(() => document.querySelector('.game-shell').classList.remove('screen-shake'), 380);
}

function loadGame(){
  guardSequentialAccess();
  completedCurrent = false;
  verifyBtn.disabled = false;
  nextBtn.disabled = true;
  feedback.textContent = '';
  feedback.className = 'feedback';
  scoreEl.textContent = getScore();
  gameStep.textContent = `Juego ${currentGame} de 6`;
  gameTitle.textContent = gameData[currentGame - 1].title;
  gameData[currentGame - 1].render();
  speak(gameData[currentGame - 1].instruction);
}

restartBtn.addEventListener('click', loadGame);

verifyBtn.addEventListener('click', () => {
  if(validateBoard()){
    markCorrect();
  }else{
    markIncorrect();
  }
});

nextBtn.addEventListener('click', () => {
  if(!completedCurrent) return;
  if(currentGame >= 6){
    window.location.href = 'final.html';
    return;
  }

  currentGame++;
  window.history.replaceState(null, '', `?juego=${currentGame}`);
  loadGame();
});

selectBtn.addEventListener('click', () => {
  window.location.href = 'cuarto-basico.html';
});

backMenu.addEventListener('click', () => {
  window.location.href = 'cuarto-basico.html';
});

guardSequentialAccess();
setScore(getScore());
loadGame();
