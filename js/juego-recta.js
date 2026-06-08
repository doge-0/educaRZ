function renderNumberLine() {

  const colors = [
    'car-red',
    'car-blue',
    'car-green',
    'car-purple',
    'car-orange'
  ];

  const numbers = uniqueRandomNumbers(
    6,
    1000,
    9999,
    25
  ).sort((a,b)=>a-b);

  const shuffled = [...numbers]
    .sort(() => Math.random() - 0.5);

  board.appendChild(
    makeBank(
      shuffled.map((number,index) => ({

        label: `
          <div class="car-body ${colors[index % colors.length]}">
            <span>${formatNumber(number)} km</span>
          </div>
        `,

        value: String(number),

        speak: `${formatNumber(number)} kilometros`,

        className:'car-card'

      }))
    )
  );

  const road = document.createElement('div');
  road.className = 'race-road';

  road.insertAdjacentHTML(
    'beforeend',
    `
      <div class="cloud cloud-1">☁️</div>
      <div class="cloud cloud-2">☁️</div>
      <div class="cloud cloud-3">☁️</div>
    `
  );

  numbers.forEach((number,index)=>{

    const zone = makeZone(
      '',
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