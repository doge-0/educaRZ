function compareSign(left, right){
  if(left > right) return '>';
  if(left < right) return '<';
  return '=';
}

function makeTeamCard(number, side){

  return `
    <div class="team-card team-${side}">
      <div class="team-avatar">
        ${side === 'left' ? '🐘' : '🦁'}
      </div>

      <div class="team-label">
        ${side === 'left'
          ? 'Equipo Elefante'
          : 'Equipo León'}
      </div>

      <strong class="team-number">
        ${formatNumber(number)}
      </strong>
    </div>
  `;
}

function renderCompare(){

  const rows = [];

  const patterns = [
    '>',
    '<',
    '=',
    ['>', '<', '='][randomInt(0, 2)]
  ];

  const shuffledPatterns = shuffle(patterns);

  shuffledPatterns.forEach(sign => {

    const left = randomInt(1000, 9999);

    let right;

    if(sign === '>'){

      right = left - randomInt(1, 500);

      if(right < 1000){
        right = 1000;
      }

    }else if(sign === '<'){

      right = left + randomInt(1, 500);

      if(right > 9999){
        right = 9999;
      }

    }else{

      right = left;

    }

    rows.push([
      left,
      right,
      sign
    ]);

  });

  const signs = [];

  rows.forEach(row => {

    signs.push({
      label: row[2],
      value: row[2],
      speak:
        row[2] === '>'
          ? 'mayor que'
          : row[2] === '<'
            ? 'menor que'
            : 'igual que',
      className: 'sign-token'
    });

  });

  board.appendChild(
    makeBank(shuffle(signs))
  );

  const arena = document.createElement('div');
  arena.className = 'tug-arena';

  rows.forEach(([left, right, answer]) => {

    const row = document.createElement('div');

    row.className = 'tug-row';
    row.dataset.answer = answer;

    row.innerHTML = `
      ${makeTeamCard(left, 'left')}
      <div class="rope"></div>
    `;

    const zone = makeZone(
      '?',
      answer,
      'sign-zone'
    );

    row.appendChild(zone);

    row.insertAdjacentHTML(
      'beforeend',
      `
      <div class="rope"></div>
      ${makeTeamCard(right, 'right')}
      `
    );

    arena.appendChild(row);

  });

  board.appendChild(arena);
}

/* ==============================
   ANIMACIÓN TIRA Y AFLOJA
============================== */

window.animateTugBattle = function(){

  const rows =
    document.querySelectorAll('.tug-row');

  rows.forEach(row => {

    row.classList.remove(
      'pulling',
      'left-win',
      'right-win',
      'draw'
    );

    row.classList.add('pulling');

    const answer = row.dataset.answer;

    setTimeout(() => {

      row.classList.remove('pulling');

      if(answer === '>'){

        row.classList.add('left-win');

      }else if(answer === '<'){

        row.classList.add('right-win');

      }else{

        row.classList.add('draw');
      }

    }, 800);

  });

};

/* ==============================
   VALIDACIÓN PERSONALIZADA
============================== */

function validateCompareGame(){

  const zones = [
    ...document.querySelectorAll(
      '.sign-zone[data-answer]'
    )
  ];

  const allAnswered =
    zones.every(
      zone => zone.querySelector('.draggable')
    );

  if(!allAnswered){

    speak(
      'Completa todas las comparaciones'
    );

    return false;
  }

  window.animateTugBattle();

  return zones.every(zone => {

    const sign =
      zone.querySelector('.draggable');

    return (
      sign &&
      sign.dataset.value === zone.dataset.answer
    );

  });

}

/* ==============================
   INICIO DEL JUEGO
============================== */

startSingleGame({
  number: 4,
  title: 'Tira y afloja numérico',
  theme: 'compare',
  scene: 'Desafío de fuerza',
  goal: 'Comparar números usando los signos mayor que, menor que e igual.',
  instruction: 'Arrastra el signo correcto al centro de cada tira y afloja.',
  music: 'sonidos/mayor.mp3',
  nextPage: 'juego-representaciones.html',
  render: renderCompare,
  validate: validateCompareGame
});