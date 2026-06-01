function renderStore(){
  const products = shuffle([
    ['📘', 'Cuaderno'],
    ['✏️', 'Lapices'],
    ['🧰', 'Estuche'],
    ['📏', 'Regla'],
    ['🎒', 'Mochila'],
    ['👟', 'Zapatillas'],
    ['🎧', 'Audifonos'],
    ['🥪', 'Colacion']
  ]).slice(0, 6);
  const prices = uniqueRandomNumbers(6, 1100, 9900, 35).sort((a, b) => a - b);

  board.appendChild(makeBank(products.map(([icon, name], index) => ({
    value: String(prices[index]),
    speak: `${name}, ${formatNumber(prices[index])} pesos`,
    html: `<span>${icon}</span><span>${name}<br>$${formatNumber(prices[index])}</span>`,
    className: 'store-card'
  }))));

  const row = document.createElement('div');
  row.className = 'drop-row';
  ['1 menor precio', '2', '3', '4', '5', '6 mayor precio'].forEach((label, index) => {
    row.appendChild(makeZone(label, String(prices[index])));
  });
  board.appendChild(row);
}

startSingleGame({
  number: 1,
  title: 'Tienda ordenada',
  theme: 'store',
  scene: 'Mini tienda',
  goal: 'Aprender a ordenar numeros de menor a mayor y reconocer cual numero es mas grande o mas pequeno.',
  instruction: 'Arrastra los productos desde el precio menor hasta el precio mayor. Fijate bien: algunos precios son muy parecidos.',
  nextPage: 'juego-recta.html',
  render: renderStore
});
