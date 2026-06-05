function makeOperationForResult(result, index){
  const type = index % 4;

  switch(type){

    // SUMA
    case 0:{
      const a = randomInt(1, result);
      const b = result - a;
      return `${a} + ${b}`;
    }

    // RESTA
    case 1:{
      const add = randomInt(1, 4);
      return `${result + add} - ${add}`;
    }

    // MULTIPLICACION
    case 2:{
      const factors = [];

      for(let i = 1; i <= result; i++){
        if(result % i === 0){
          factors.push(i);
        }
      }

      const a = factors[randomInt(0, factors.length - 1)];
      const b = result / a;

      return `${a} × ${b}`;
    }

    // DIVISION
    default:{
      const multiplier = randomInt(1, 5);
      return `${result * multiplier} ÷ ${multiplier}`;
    }
  }
}

function makeSudokuSolution(){

  const base = [
    [1,2,3,4,5],
    [2,3,4,5,1],
    [3,4,5,1,2],
    [4,5,1,2,3],
    [5,1,2,3,4]
  ];

  const symbols = shuffle([1,2,3,4,5]);

  return base.map(row =>
    row.map(value => symbols[value - 1])
  );
}

function clearSudokuGuide(){
  document
    .querySelectorAll('.sudoku-cell.is-guide-highlight')
    .forEach(cell => {
      cell.classList.remove('is-guide-highlight');
    });
}

function highlightSudokuGuide(type){

  clearSudokuGuide();

  if(!type) return;

  let selector = '';

  if(type.startsWith('fila')){
    selector = '.sudoku-cell[data-row="0"]';
  }
  else if(type.startsWith('columna')){
    selector = '.sudoku-cell[data-col="0"]';
  }

  if(!selector) return;

  document.querySelectorAll(selector).forEach(cell => {
    cell.classList.add('is-guide-highlight');
  });
}

function renderSudoku(){

  const solution = makeSudokuSolution();

  const fixedIndexes = shuffle([
    0,1,2,3,4,
    5,6,7,8,9,
    10,11,12,13,14,
    15,16,17,18,19,
    20,21,22,23,24
  ]).slice(0, 12);

  const emptyCells = [];

  const grid = document.createElement('div');
  grid.className = 'sudoku-grid';

  solution.flat().forEach((value, index) => {

    const row = Math.floor(index / 5);
    const col = index % 5;

    if(fixedIndexes.includes(index)){

      const fixed = document.createElement('div');

      fixed.className = 'sudoku-cell fixed';
      fixed.dataset.row = String(row);
      fixed.dataset.col = String(col);

      fixed.textContent = value;

      fixed.addEventListener('click', () => speak(value));

      grid.appendChild(fixed);

      return;
    }

    emptyCells.push({
      value,
      index
    });

    const zone = makeZone(
      '?',
      String(value),
      'sudoku-cell'
    );

    zone.dataset.row = String(row);
    zone.dataset.col = String(col);

    grid.appendChild(zone);
  });

  const operations = emptyCells.map((cell, index) => {

    const operation = makeOperationForResult(
      cell.value,
      index
    );

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
  title: 'Sudoku matemático',
  theme: 'sudoku',
  scene: 'Sudoku 5 x 5',

  goal:
    'Aprender a resolver patrones numéricos usando filas y columnas sin repetir.',

  instruction:
    'Completa la cuadrícula con operaciones. En cada fila y columna deben quedar los números 1, 2, 3, 4 y 5 sin repetir.',

  instructionEmphasis: [
    {
      text: 'fila',
      cue: 'fila',
      rate: 1,
      holdAfter: 1000
    },
    {
      text: 'columna',
      cue: 'columna',
      rate: 1,
      holdAfter: 1000
    }
  ],

  music: 'sonidos/sudoku.mp3',

  nextPage: 'final.html',

  onInstructionCue: highlightSudokuGuide,

  render: renderSudoku
});