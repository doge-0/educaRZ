function compareSign(left, right){
  if(left > right) return '>';
  if(left < right) return '<';
  return '=';
}

function renderCompare(){
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

startSingleGame({
  number: 4,
  title: 'Mayor o menor',
  theme: 'compare',
  scene: 'Duelo de numeros',
  goal: 'Aprender a comparar numeros usando los signos mayor que, menor que e igual.',
  instruction: 'Arrastra el signo correcto en cada comparacion. Hay mas de una respuesta que resolver.',
  nextPage: 'juego-representaciones.html',
  render: renderCompare
});
