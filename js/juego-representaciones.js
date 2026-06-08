function placeValueText(number){

  const [um, c, d, u] =
    splitDigits(number).map(Number);

  const parts = [];

  if(um) parts.push(`${um}.000`);
  if(c) parts.push(`${c}00`);
  if(d) parts.push(`${d}0`);
  if(u) parts.push(`${u}`);

  return parts.join(' + ');
}

function placeValueShort(number){

  const [um, c, d, u] =
    splitDigits(number);

  return `${um} UM + ${c} C + ${d} D + ${u} U`;
}

function speakPlaceValue(number){

  const [um, c, d, u] =
    splitDigits(number).map(Number);

  const parts = [];

  if(um){
    parts.push(
      `${um} unidades de mil`
    );
  }

  if(c){
    parts.push(
      `${c} centenas`
    );
  }

  if(d){
    parts.push(
      `${d} decenas`
    );
  }

  if(u){
    parts.push(
      `${u} unidades`
    );
  }

  return `Representación formada por ${parts.join(', ')}`;
}

function renderRepresentations(){

  const colors = [
    'piece-red',
    'piece-blue',
    'piece-green',
    'piece-purple',
    'piece-orange',
    'piece-pink'
  ];

  const numbers =
    uniqueRandomNumbers(
      6,
      1000,
      9999,
      40
    );

  const cards = numbers.map((number,index) => ({

    label:
      `
      <div class="piece-content ${colors[index % colors.length]}">
        ${
          Math.random() < 0.5
            ? placeValueText(number)
            : placeValueShort(number)
        }
      </div>
      `,

    value: String(number),

    speak: speakPlaceValue(number),

    className: 'puzzle-piece'

  }));

  board.appendChild(
    makeBank(cards)
  );

  const grid =
    document.createElement('div');

  grid.className =
    'puzzle-board-grid';

  numbers.forEach(number => {

    const target =
      document.createElement('div');

    target.className =
      'puzzle-board';

    target.innerHTML = `
      <div class="board-header">
        🧩 Número secreto
      </div>

      <div class="board-number">
        ${formatNumber(number)}
      </div>
    `;

    target.appendChild(
      makeZone(
        'Encaja aquí',
        String(number),
        'puzzle-zone'
      )
    );

    grid.appendChild(target);

  });

  board.appendChild(grid);

  setTimeout(() => {

    document
      .querySelectorAll('.puzzle-zone')
      .forEach(zone => {

        zone.addEventListener('drop', () => {

          zone.classList.add('correct');

          setTimeout(() => {
            zone.classList.remove('correct');
          }, 800);

        });

      });

  }, 100);

}

startSingleGame({
  number: 5,
  title: 'Rompecabezas numérico',
  theme: 'represent',
  scene: 'Taller de rompecabezas',
  goal: 'Relacionar cada número con su representación posicional.',
  instruction: 'Arrastra cada pieza del rompecabezas hasta el número correcto.',
  music: 'sonidos/representaciones.mp3',
  nextPage: 'juego-sudoku.html',
  render: renderRepresentations
});