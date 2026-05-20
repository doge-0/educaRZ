/* ========= IMAGENES ========= */

const fishImages = [
  "img/Catfish.webp",
  "img/pezperro.webp",
  "img/Sunfish.webp"
];

/* ========= ELEMENTOS ========= */

const game = document.getElementById('game');
const equationEl = document.getElementById('equation');
const caughtEl = document.getElementById('caught');
const timerEl = document.getElementById('timer');
const scoreEl = document.getElementById('score');
const streakEl = document.getElementById('streak');
const verifyBtn = document.getElementById('verifyBtn');
const messageEl = document.getElementById('message');

/* ========= VARIABLES ========= */

let target = 0;
let caught = 0;
let score = 0;
let streak = 0;
let fishCount = 10;
let fishSpeed = 1.2;
let difficulty = 'easy';

let timer;
let timeLeft = 0;

/* ========= VOZ ========= */

function speak(text){

  const voice = new SpeechSynthesisUtterance(text);

  voice.lang = 'es-ES';
  voice.pitch = 0.9;
  voice.rate = 0.95;

  speechSynthesis.speak(voice);
}

/* ========= VOZ NUMEROS ========= */

function speakNumber(number){

  speechSynthesis.cancel();

  const voice = new SpeechSynthesisUtterance(number.toString());

  voice.lang = 'es-ES';
  voice.pitch = 1;
  voice.rate = 0.9;
  voice.volume = 1;

  speechSynthesis.speak(voice);
}

/* ========= DIFICULTAD ========= */

function setDifficulty(level){

  difficulty = level;

  if(level === 'easy'){
    fishCount = 8;
    fishSpeed = 1.1;
  }

  if(level === 'medium'){
    fishCount = 12;
    fishSpeed = 1.6;
  }

  if(level === 'hard'){
    fishCount = 14;
    fishSpeed = 2.2;
  }

  startRound();
}

/* ========= RANDOM ========= */

function random(min,max){
  return Math.floor(Math.random()*(max-min)+min);
}

/* ========= ECUACIONES ========= */

function generateEquation(){

  let a,b;

  if(difficulty === 'easy'){
    a = random(1,6);
    b = random(1,5);
  }

  else if(difficulty === 'medium'){
    a = random(3,9);
    b = random(1,8);
  }

  else{
    a = random(5,12);
    b = random(1,10);
  }

  const type = Math.random() > 0.5 ? '+' : '-';

  if(type === '+'){
    target = a+b;
  }else{

    if(a < b){
      [a,b] = [b,a];
    }

    target = a-b;
  }

  equationEl.innerHTML = `${a} ${type} ${b}`;
}

/* ========= PECES ========= */

function createFish(){

  document.querySelectorAll('.fish').forEach(f=>f.remove());

  for(let i=0;i<fishCount;i++){

    const fish = document.createElement('div');
    fish.classList.add('fish');

    const img = document.createElement('img');

    const selectedFish = fishImages[random(0, fishImages.length)];

    img.src = selectedFish;

    /* DEBUG */
    console.log("Cargando:", selectedFish);

    fish.appendChild(img);

    fish.style.left = random(10,85)+'vw';
    fish.style.top = random(20,80)+'vh';

    let dx = Math.random() > 0.5 ? 1 : -1;
    let dy = Math.random() > 0.5 ? 1 : -1;

    fish.onclick = ()=>{

    fish.remove();

    caught++;

    caughtEl.innerText = caught;

    /* SONIDO DEL NUMERO */
    speakNumber(caught);

    popText('+1', fish.style.left, fish.style.top);
    };

    game.appendChild(fish);

    setInterval(()=>{

      let x = parseFloat(fish.style.left);
      let y = parseFloat(fish.style.top);

      x += dx * fishSpeed * 0.12;
      y += dy * fishSpeed * 0.09;

      if(x > 88 || x < 2){
        dx *= -1;

        fish.style.transform =
          dx < 0 ? 'scaleX(-1)' : 'scaleX(1)';
      }

      if(y > 82 || y < 15){
        dy *= -1;
      }

      fish.style.left = x+'vw';
      fish.style.top = y+'vh';

    },30);
  }
}

/* ========= VERIFICAR ========= */

function verifyAnswer(){

  if(caught === target){

    let gained = 10 + (streak * 2);

    score += gained;

    streak++;

    scoreEl.innerText = score;
    streakEl.innerText = streak;

    showMessage('🌟 ¡Correcto!');

    speak(randomPraise());

  }else{

    streak = 0;

    streakEl.innerText = streak;

    showMessage('😅 Intenta otra vez');

    speak('Sigue intentando');
  }

  setTimeout(()=>{
    startRound();
  },1600);
}

/* ========= MENSAJES ========= */

function randomPraise(){

  const praises = [

    'Excelente trabajo',
    'Muy bien hecho',
    'Fantástico',
    'Buen trabajo pescador',
    'Lo estás haciendo genial'

  ];

  return praises[random(0,praises.length)];
}

function showMessage(text){

  messageEl.innerHTML = text;

  messageEl.style.display = 'block';

  setTimeout(()=>{
    messageEl.style.display = 'none';
  },1200);
}

function popText(text,x,y){

  const pop = document.createElement('div');

  pop.classList.add('pop');

  pop.innerText = text;

  pop.style.left = x;
  pop.style.top = y;

  game.appendChild(pop);

  setTimeout(()=>{
    pop.remove();
  },1000);
}

/* ========= TIMER ========= */

function startTimer(){

  clearInterval(timer);

  if(difficulty !== 'hard'){

    timerEl.innerText = '--';

    verifyBtn.style.display = 'inline-block';

    return;
  }

  verifyBtn.style.display = 'none';

  timeLeft = 8;

  timerEl.innerText = timeLeft;

  timer = setInterval(()=>{

    timeLeft--;

    timerEl.innerText = timeLeft;

    if(timeLeft <= 0){

      clearInterval(timer);

      verifyAnswer();
    }

  },1000);
}

/* ========= BURBUJAS ========= */

function createBubbles(){

  setInterval(()=>{

    const bubble = document.createElement('div');

    bubble.classList.add('bubble');

    const size = random(10,35);

    bubble.style.width = size+'px';
    bubble.style.height = size+'px';

    bubble.style.left = random(0,100)+'vw';

    bubble.style.animationDuration = random(5,12)+'s';

    game.appendChild(bubble);

    setTimeout(()=>{
      bubble.remove();
    },12000);

  },500);
}

/* ========= START ========= */

function startRound(){

  caught = 0;

  caughtEl.innerText = 0;

  generateEquation();

  createFish();

  startTimer();
}

createBubbles();

setDifficulty('easy');