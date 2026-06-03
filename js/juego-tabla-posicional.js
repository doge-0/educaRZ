let memoryAnswer = '';
let countdownTimer = null;

function makeClockNumber(){
  const hour = randomInt(12, 23);
  const minute = randomInt(0, 59);
  const minuteText = String(minute).padStart(2, '0');

  return {
    display: `${hour}:${minuteText}`,
    answer: `${hour}${minuteText}`
  };
}

function normalizeMemoryAnswer(value){
  return value.replace(/\D/g, '');
}

function renderPlaceMemory(){
  clearInterval(countdownTimer);

  const clockNumber = makeClockNumber();
  memoryAnswer = clockNumber.answer;
  verifyBtn.disabled = true;

  const wrap = document.createElement('div');
  wrap.className = 'memory-clock-game';
  wrap.innerHTML = `
    <div class="digital-watch" aria-live="polite">
      <span class="watch-label">Memoriza</span>
      <strong id="memoryCountdown">3</strong>
    </div>
    <div class="memory-number" id="memoryNumber">${clockNumber.display}</div>
    <div class="memory-answer is-hidden" id="memoryAnswerBox">
      <label for="memoryInput">Escribe el numero que viste</label>
      <input id="memoryInput" type="text" inputmode="numeric" autocomplete="off" maxlength="5">
      <p>Tambien puedes escribirlo con dos puntos, como ${clockNumber.display}.</p>
    </div>
  `;
  board.appendChild(wrap);

  const countdown = document.getElementById('memoryCountdown');
  const number = document.getElementById('memoryNumber');
  const answerBox = document.getElementById('memoryAnswerBox');
  const input = document.getElementById('memoryInput');
  let seconds = 3;

  countdownTimer = setInterval(() => {
    seconds--;
    countdown.textContent = seconds;

    if(seconds === 0){
      clearInterval(countdownTimer);
      countdown.textContent = '0';
      number.classList.add('is-hidden');
      answerBox.classList.remove('is-hidden');
      verifyBtn.disabled = false;
      input.focus();
    }
  }, 1000);

  input.addEventListener('keydown', event => {
    if(event.key === 'Enter' && !verifyBtn.disabled){
      verifyBtn.click();
    }
  });
}

function validatePlaceMemory(){
  const input = document.getElementById('memoryInput');
  if(!input) return false;

  return normalizeMemoryAnswer(input.value) === memoryAnswer;
}

startSingleGame({
  number: 3,
  title: 'Reloj de memoria',
  theme: 'place',
  scene: 'Reloj digital',
  goal: 'Memorizar numeros en formato de hora digital y escribirlos despues de una cuenta regresiva.',
  instruction: 'Mira el numero del reloj durante 3 segundos. Cuando desaparezca, escribe exactamente el numero que memorizaste.',
  music: 'sonidos/reloj.mp3',
  nextPage: 'juego-mayor-menor.html',
  render: renderPlaceMemory,
  validate: validatePlaceMemory
});
