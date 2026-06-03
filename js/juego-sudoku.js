function makeOperationForResult(result, index){
  const type = index % 2;

  if(type === 0){
    const add = randomInt(1, 2);
    return `${result + add} - ${add}`;
  }

  const add = randomInt(1, Math.min(2, result));
  return `${result - add} + ${add}`;
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

function clearSudokuGuide(){
  document.querySelectorAll('.sudoku-cell.is-guide-highlight').forEach(cell => {
    cell.classList.remove('is-guide-highlight');
  });
}

function highlightSudokuGuide(type){
  clearSudokuGuide();

  if(!type) return;

  let selector = '';

  if(type.startsWith('fila')){
    selector = '.sudoku-cell[data-row="0"]';
  }else if(type.startsWith('columna')){
    selector = '.sudoku-cell[data-col="0"]';
  }else if(type.startsWith('bloque')){
    selector = '.sudoku-cell[data-block="0"]';
  }

  if(!selector) return;

  document.querySelectorAll(selector).forEach(cell => {
    cell.classList.add('is-guide-highlight');
  });
}

function renderSudoku(){
  const solution = makeSudokuSolution();
  const fixedIndexes = shuffle([0, 1, 2, 5, 7, 8, 10, 13, 14, 15]).slice(0, 8);
  const emptyCells = [];

  const grid = document.createElement('div');
  grid.className = 'sudoku-grid';

  solution.flat().forEach((value, index) => {
    const row = Math.floor(index / 4);
    const col = index % 4;
    const block = Math.floor(row / 2) * 2 + Math.floor(col / 2);

    if(fixedIndexes.includes(index)){
      const fixed = document.createElement('div');
      fixed.className = 'sudoku-cell fixed';
      fixed.dataset.row = String(row);
      fixed.dataset.col = String(col);
      fixed.dataset.block = String(block);
      fixed.textContent = value;
      fixed.addEventListener('click', () => speak(value));
      grid.appendChild(fixed);
      return;
    }

    emptyCells.push({ value, index });
    const zone = makeZone('?', String(value), 'sudoku-cell');
    zone.dataset.row = String(row);
    zone.dataset.col = String(col);
    zone.dataset.block = String(block);
    grid.appendChild(zone);
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

startSingleGame({
  number: 6,
  title: 'Sudoku matematico',
  theme: 'sudoku',
  scene: 'Sudoku 4 x 4',
  goal: 'Aprender a resolver patrones numericos usando filas, columnas y bloques sin repetir.',
  instruction: 'Completa la cuadricula con operaciones. En cada fila, columna y bloque de 2 por 2 deben quedar 1, 2, 3 y 4 sin repetir.',
  instructionEmphasis: [
    { text: 'fila', cue: 'fila', rate: 0.62, holdAfter: 1600 },
    { text: 'columna', cue: 'columna', rate: 0.62, holdAfter: 1600 },
    { text: 'bloque de 2 por 2', cue: 'bloque', rate: 0.62, holdAfter: 2200 }
  ],
  music: 'sonidos/sudoku.mp3',
  nextPage: 'final.html',
  onInstructionCue: highlightSudokuGuide,
  render: renderSudoku
});
