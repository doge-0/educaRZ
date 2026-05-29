const finalScore = document.getElementById('finalScore');
const playAgain = document.getElementById('playAgain');
const menuBtn = document.getElementById('menuBtn');

function speak(text){
  if(typeof speechSynthesis === 'undefined') return;
  speechSynthesis.cancel();
  const voice = new SpeechSynthesisUtterance(text);
  voice.lang = 'es-ES';
  voice.rate = 0.95;
  speechSynthesis.speak(voice);
}

function createConfetti(){
  for(let i = 0; i < 90; i++){
    const confetti = document.createElement('div');
    confetti.className = 'confetti-piece';
    confetti.style.left = Math.random() * 100 + 'vw';
    confetti.style.background = `hsl(${Math.random() * 360}, 95%, 62%)`;
    confetti.style.animationDelay = Math.random() * 1.2 + 's';
    document.body.appendChild(confetti);
    setTimeout(() => confetti.remove(), 3600);
  }
}

finalScore.textContent = localStorage.getItem('cuartoBasicoScore') || '0';
createConfetti();
setTimeout(() => speak('Felicitaciones, completaste todos los juegos'), 400);

playAgain.addEventListener('click', () => {
  localStorage.setItem('cuartoBasicoScore', '0');
  localStorage.setItem('cuartoBasicoUnlocked', '1');
  window.location.href = 'cuarto-basico-juegos.html?juego=1';
});

menuBtn.addEventListener('click', () => {
  window.location.href = 'cuarto-basico.html';
});
