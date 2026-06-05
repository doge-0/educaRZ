function renderNumberLine() {

  const numbers = uniqueRandomNumbers(6, 1000, 9999, 25)
    .sort((a, b) => a - b);

  const shuffled = [...numbers].sort(() => Math.random() - 0.5);

  board.appendChild(
    makeBank(
      shuffled.map(number => ({
        label: `
          <div class="car-body">
            <span>${formatNumber(number)} km</span>
          </div>
        `,
        value: String(number),
        speak: `${formatNumber(number)} kilometros`,
        className: 'car-card'
      }))
    )
  );

  const road = document.createElement('div');
  road.className = 'race-road';

  numbers.forEach((number, index) => {

    let label = '';

    if(index === 0){
      label = '🚩 Menos km';
    }

    if(index === numbers.length - 1){
      label = '🏁 Más km';
    }

    const zone = makeZone(
      label || '',
      String(number),
      'road-slot'
    );

    road.appendChild(zone);
  });

  board.appendChild(road);
}

startSingleGame({
  number: 2,
  title: 'Carrera de kilómetros',
  theme: 'line',
  scene: 'Autopista numérica',
  goal: 'Ordena los autos desde el que ha recorrido menos kilómetros hasta el que ha recorrido más.',
  instruction: 'Arrastra cada automóvil a la carretera y ordénalo desde el menor número hasta el mayor número.',
  music: 'sonidos/carretera.mp3',
  nextPage: 'juego-tabla-posicional.html',
  render: renderNumberLine
});