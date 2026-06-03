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

function renderRepresentations(){
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

startSingleGame({
  number: 5,
  title: 'Representaciones',
  theme: 'represent',
  scene: 'Galeria de representaciones',
  goal: 'Aprender a relacionar un numero con su descomposicion y representacion posicional.',
  instruction: 'Une cada numero con su forma escrita o descompuesta. Lee con calma antes de soltar.',
  music: 'sonidos/representaciones.mp3',
  nextPage: 'juego-sudoku.html',
  render: renderRepresentations
});
