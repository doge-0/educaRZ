const games = [
  {
    title: 'Tienda ordenada',
    text: 'Ordena productos desde el menor precio hasta el mayor.',
    page: 'juego-tienda-ordenada.html',
    theme: 'store',
    icon: '🛒'
  },
  {
    title: 'Recta numerica',
    text: 'Ubica numeros naturales de menor a mayor en la recta.',
    page: 'juego-recta.html',
    theme: 'line',
    icon: '↔'
  },
  {
    title: 'Reloj de memoria',
    text: 'Memoriza una hora digital y escribe el numero antes de avanzar.',
    page: 'juego-tabla-posicional.html',
    theme: 'clock',
    icon: '12:45'
  },
  {
    title: 'Mayor o menor',
    text: 'Compara numeros y escoge el signo correcto.',
    page: 'juego-mayor-menor.html',
    theme: 'compare',
    icon: '>'
  },
  {
    title: 'Representaciones',
    text: 'Relaciona numeros con su descomposicion o lectura.',
    page: 'juego-representaciones.html',
    theme: 'represent',
    icon: '▣'
  },
  {
    title: 'Sudoku matematico',
    text: 'Completa la cuadricula con numeros sin repetir.',
    page: 'juego-sudoku.html',
    theme: 'sudoku',
    icon: '4×4'
  }
];

const grid = document.getElementById('gamesGrid');
const scoreEl = document.getElementById('puntajeMenu');
const backHome = document.getElementById('backHome');
const resetProgress = document.getElementById('resetProgress');

function getScore(){
  return Number(localStorage.getItem('cuartoBasicoScore') || '0');
}

function getUnlocked(){
  return Number(localStorage.getItem('cuartoBasicoUnlocked') || '1');
}

function renderMenu(){
  const unlocked = getUnlocked();
  scoreEl.textContent = getScore();
  grid.innerHTML = '';

  games.forEach((game, index) => {
    const gameNumber = index + 1;
    const button = document.createElement('button');
    const completed = gameNumber < unlocked;
    const available = gameNumber <= unlocked;

    button.className = `game-card menu-theme-${game.theme}`;
    button.disabled = !available;
    button.innerHTML = `
      <span class="number">${gameNumber}</span>
      <span class="game-card-icon" aria-hidden="true">${game.icon}</span>
      <h2>${game.title}</h2>
      <p>${game.text}</p>
      <span class="state">${completed ? 'Completado' : available ? 'Disponible' : 'Bloqueado'}</span>
    `;

    button.addEventListener('click', () => {
      if(!available) return;
      window.location.href = game.page;
    });

    grid.appendChild(button);
  });
}

backHome.addEventListener('click', () => {
  window.location.href = 'bienvenida.html';
});

resetProgress.addEventListener('click', () => {
  localStorage.setItem('cuartoBasicoScore', '0');
  localStorage.setItem('cuartoBasicoUnlocked', '1');
  renderMenu();
});

renderMenu();

requestAnimationFrame(() => {

  document
    .querySelectorAll('.game-card')
    .forEach((card,index) => {

      card.style.animationDelay =
        `${index * 120}ms`;

    });

});