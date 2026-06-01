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

function renderSudoku(){
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

startSingleGame({
  number: 6,
  title: 'Sudoku matematico',
  theme: 'sudoku',
  scene: 'Sudoku 4 x 4',
  goal: 'Aprender a resolver patrones numericos usando filas, columnas y bloques sin repetir.',
  instruction: 'Completa la cuadricula con operaciones. En cada fila, columna y bloque de 2 por 2 deben quedar 1, 2, 3 y 4 sin repetir.',
  nextPage: 'final.html',
  render: renderSudoku
});
