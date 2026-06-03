function renderNumberLine(){
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

startSingleGame({
  number: 2,
  title: 'Recta numerica',
  theme: 'line',
  scene: 'Recta viajera',
  goal: 'Aprender a ubicar numeros naturales de menor a mayor en una recta numerica.',
  instruction: 'Ubica cada numero en la recta numerica, de menor a mayor. Compara millares, centenas, decenas y unidades.',
  music: 'sonidos/carretera.mp3',
  nextPage: 'juego-tabla-posicional.html',
  render: renderNumberLine
});
