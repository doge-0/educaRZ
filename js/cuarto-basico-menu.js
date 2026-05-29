const games = [
  {
    title: 'Tienda ordenada',
    text: 'Ordena productos desde el menor precio hasta el mayor.'
  },
  {
    title: 'Recta numérica',
    text: 'Ubica números naturales de menor a mayor en la recta.'
  },
  {
    title: 'Tabla posicional',
    text: 'Forma números usando unidad de mil, centena, decena y unidad.'
  },
  {
    title: 'Mayor o menor',
    text: 'Compara números y escoge el signo correcto.'
  },
  {
    title: 'Representaciones',
    text: 'Relaciona números con su descomposición o lectura.'
  },
  {
    title: 'Sudoku matemático',
    text: 'Completa la cuadrícula con números sin repetir.'
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

    button.className = 'game-card';
    button.disabled = !available;
    button.innerHTML = `
      <span class="number">${gameNumber}</span>
      <h2>${game.title}</h2>
      <p>${game.text}</p>
      <span class="state">${completed ? 'Completado' : available ? 'Disponible' : 'Bloqueado'}</span>
    `;

    button.addEventListener('click', () => {
      if(!available) return;
      window.location.href = `cuarto-basico-juegos.html?juego=${gameNumber}`;
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
