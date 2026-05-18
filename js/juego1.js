// Variables globales
let stage = 1;
let sumA = 0;
let sumB = 0;
let targetSum = 0;
let subA = 0;
let subB = 0;
let stage1Count = 0;
let stage2Count = 0;
let netHolding = false;

function cargarUsuario() {
    const nombre = localStorage.getItem('nombreUsuario');
    const avatar = localStorage.getItem('avatarSeleccionado');

    if (!nombre || !avatar) {
        console.log('No hay datos de usuario en juego1');
        return;
    }

    const avatarMap = {
        avatar1: 'alce.png',
        avatar2: 'leon.png',
        avatar3: 'rana.png',
        avatar4: 'tigre.png'
    };

    const avatarEl = document.getElementById('avatarUsuario');
    const nombreEl = document.getElementById('nombreUsuario');
    if (avatarEl) {
        avatarEl.src = 'img/' + avatarMap[avatar];
    }
    if (nombreEl) {
        nombreEl.textContent = nombre;
    }
}

document.addEventListener('DOMContentLoaded', function() {
    cargarUsuario();
    initGame();

    const lagoArea = document.getElementById('lago-area');
    lagoArea.addEventListener('dragover', dragOver);
    lagoArea.addEventListener('drop', dropEnLago);
    lagoArea.addEventListener('dragleave', dragLeave);

    const pecera = document.getElementById('pecera-area');
    pecera.addEventListener('dragover', dragOver);
    pecera.addEventListener('drop', dropEnPecera);
    pecera.addEventListener('dragleave', dragLeave);

    const redPesca = document.getElementById('red-pesca');
    redPesca.addEventListener('dragstart', dragStartRed);
    redPesca.addEventListener('dragend', dragEndRed);

    document.getElementById('btn-siguiente').addEventListener('click', setupStage2);
    document.getElementById('btn-reiniciar').addEventListener('click', initGame);
});

function initGame() {
    stage = 1;
    stage1Count = 0;
    stage2Count = 0;
    netHolding = false;
    document.getElementById('feedback').textContent = '';
    document.getElementById('btn-siguiente').classList.add('oculto');
    document.getElementById('btn-reiniciar').classList.add('oculto');
    setupStage1();
}

function setupStage1() {
    stage = 1;
    stage1Count = 0;
    netHolding = false;
    sumA = Math.floor(Math.random() * 8) + 1;
    sumB = Math.floor(Math.random() * 8) + 1;
    targetSum = sumA + sumB;

    document.getElementById('instruccion').textContent = 'Etapa 1: suma';
    document.getElementById('operacion-suma').textContent = `${sumA} + ${sumB}`;
    document.getElementById('lago-area').innerHTML = '';
    document.getElementById('pecera-area').innerHTML = '';
    crearAxolotlEnLago();
    showFeedback('Arrastra la red al lago para capturar un Axolotl.', '');
}

function setupStage2() {
    stage = 2;
    stage2Count = 0;
    netHolding = false;
    subA = Math.floor(Math.random() * 5) + 6;
    subB = Math.floor(Math.random() * (subA - 1)) + 1;

    document.getElementById('instruccion').textContent = 'Etapa 2: resta';
    document.getElementById('operacion-suma').textContent = `${subA} - ${subB}`;
    document.getElementById('lago-area').innerHTML = '';
    createPeceraAxolotls(subA);
    document.getElementById('btn-siguiente').classList.add('oculto');
    showFeedback('Ahora saca los Axolotls de la pecera con la red y llévalos al lago.', '');
}

function crearAxolotlEnLago() {
    const lagoArea = document.getElementById('lago-area');
    lagoArea.innerHTML = '';
    const axolotl = document.createElement('div');
    axolotl.className = 'axolotl';
    lagoArea.appendChild(axolotl);
}

function createPeceraAxolotls(count) {
    const pecera = document.getElementById('pecera-area');
    pecera.innerHTML = '';
    for (let i = 0; i < count; i++) {
        const axolotl = document.createElement('div');
        axolotl.className = 'axolotl';
        pecera.appendChild(axolotl);
    }
}

function dragStartRed(e) {
    e.dataTransfer.setData('tipo', 'red');
    e.dataTransfer.setData('text/plain', 'red');
    e.dataTransfer.effectAllowed = 'move';
    this.classList.add('arrastrando');
}

function dragEndRed() {
    this.classList.remove('arrastrando');
}

function dragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    this.classList.add('drag-over');
}

function dropEnLago(e) {
    e.preventDefault();
    this.classList.remove('drag-over');

    const tipoData = e.dataTransfer.getData('tipo') || e.dataTransfer.getData('text/plain');
    if (tipoData !== 'red') {
        return;
    }

    if (stage === 1) {
        if (netHolding) {
            showFeedback('Ya tienes un Axolotl en la red. Suéltalo en la pecera.', 'incorrecto');
            return;
        }

        const lagoArea = document.getElementById('lago-area');
        const axolotl = lagoArea.querySelector('.axolotl');
        if (!axolotl) {
            showFeedback('No hay Axolotl en el lago. Espera a que aparezca.', 'incorrecto');
            return;
        }

        axolotl.remove();
        netHolding = true;
        showFeedback('¡Has atrapado un Axolotl! Llévalo a la pecera.', '');
    } else if (stage === 2) {
        if (!netHolding) {
            showFeedback('Primero atrapa un Axolotl de la pecera.', 'incorrecto');
            return;
        }

        netHolding = false;
        stage2Count += 1;
        showFeedback(`Has devuelto ${stage2Count} Axolotl(s) al lago.`, 'correcto');

        if (stage2Count === subB) {
            showGameComplete();
        }
    }
}

function dropEnPecera(e) {
    e.preventDefault();
    this.classList.remove('drag-over');

    const tipoData = e.dataTransfer.getData('tipo') || e.dataTransfer.getData('text/plain');
    if (tipoData !== 'red') {
        return;
    }

    if (stage === 1) {
        if (!netHolding) {
            showFeedback('Primero atrapa un Axolotl en el lago con la red.', 'incorrecto');
            return;
        }

        netHolding = false;
        stage1Count += 1;
        addAxolotlToPecera();

        if (stage1Count < targetSum) {
            crearAxolotlEnLago();
            showFeedback(`Has llevado ${stage1Count} Axolotl(s) a la pecera. Sigue con la suma.`, 'correcto');
        } else {
            document.getElementById('btn-siguiente').classList.remove('oculto');
            showFeedback('¡Perfecto! Has completado la suma. Pulsa Siguiente etapa.', 'correcto');
        }
    } else if (stage === 2) {
        if (netHolding) {
            showFeedback('La red ya tiene un Axolotl. Llévalo al lago.', 'incorrecto');
            return;
        }

        const pecera = document.getElementById('pecera-area');
        const axolotl = pecera.querySelector('.axolotl');
        if (!axolotl) {
            showFeedback('No quedan Axolotls en la pecera para sacar.', 'incorrecto');
            return;
        }

        axolotl.remove();
        netHolding = true;
        showFeedback('¡Has atrapado un Axolotl de la pecera! Suéltalo en el lago.', '');
    }
}

function addAxolotlToPecera() {
    const pecera = document.getElementById('pecera-area');
    const axolotl = document.createElement('div');
    axolotl.className = 'axolotl';
    pecera.appendChild(axolotl);
}

function showGameComplete() {
    showFeedback('¡Genial! Has completado la resta. Juego terminado.', 'correcto');
    document.getElementById('btn-reiniciar').classList.remove('oculto');
}

function showFeedback(text, type) {
    const feedbackEl = document.getElementById('feedback');
    feedbackEl.textContent = text;
    feedbackEl.classList.remove('correcto', 'incorrecto');
    if (type === 'correcto') {
        feedbackEl.classList.add('correcto');
    } else if (type === 'incorrecto') {
        feedbackEl.classList.add('incorrecto');
    }
}
