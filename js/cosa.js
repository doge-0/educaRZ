const sonidoClick = new Audio('sonidos/click.mp3');
const sonidoBurbujaPez = new Audio('sonidos/burbujapez.mp3');
const sonidoConfeti = new Audio('sonidos/confetiburbuja.mp3');

function reproducirClick() {
    sonidoClick.currentTime = 0;
    sonidoClick.play().catch(() => {
        // El navegador puede bloquear reproducción automática hasta que el usuario interactúe
    });
}

function reproducirBurbujaPez() {
    sonidoBurbujaPez.currentTime = 0;
    sonidoBurbujaPez.play().catch(() => {
        // El navegador puede bloquear reproducción automática hasta que el usuario interactúe
    });
}

const mensajesPez = [
    { texto: 'glup glup glup glup', peso: 50 },
    { texto: 'Este es el camino al exito', peso: 20 },
    { texto: 'Si buscas aprender estas en el lugar correcto', peso: 15 },
    { texto: 'Solo soy un pez', peso: 15 }
];

function reproducirVoz(texto, callback) {
    const speech = new SpeechSynthesisUtterance(texto);
    speech.lang = 'es-ES';
    speech.rate = 0;
    speech.pitch = 1;
    speech.volume = 1;
    speech.onend = () => {
        if (typeof callback === 'function') {
            callback();
        }
    };
    speechSynthesis.cancel();
    speechSynthesis.speak(speech);
}

function obtenerMensajePezAleatorio() {
    const totalPesos = mensajesPez.reduce((suma, mensaje) => suma + mensaje.peso, 0);
    let aleatorio = Math.random() * totalPesos;
    for (const mensaje of mensajesPez) {
        aleatorio -= mensaje.peso;
        if (aleatorio <= 0) {
            return mensaje.texto;
        }
    }
    return mensajesPez[mensajesPez.length - 1].texto;
}

function reproducirConfeti() {
    sonidoConfeti.currentTime = 0;
    sonidoConfeti.play().catch(() => {
        // El navegador puede bloquear reproducción automática
    });
}

function ocultarGif() {
    const gifBurbujas = document.getElementById('gif-burbujas');
    if (gifBurbujas) {
        gifBurbujas.style.display = 'none';
    }
    sonidoConfeti.pause();
    sonidoConfeti.currentTime = 0;
}

function mostrarGifConSonido() {
    const gifBurbujas = document.getElementById('gif-burbujas');
    gifBurbujas.style.display = 'flex';
    reproducirConfeti();
    setTimeout(() => {
        ocultarGif();
    }, 1800);
}

let gifMostrado = false;
let bienHechoTimeout = null;
let avatarVozTerminada = false;
let bienHechoNombre = '';

function limpiarBienHecho() {
    if (bienHechoTimeout) {
        clearTimeout(bienHechoTimeout);
        bienHechoTimeout = null;
    }
    bienHechoNombre = '';
}

function iniciarBienHecho(nombre) {
    limpiarBienHecho();
    bienHechoNombre = nombre;
    bienHechoTimeout = setTimeout(() => {
        const nombreActual = document.getElementById('nombrePersona').value.trim();
        const avatarSeleccionado = document.querySelector('input[name="avatar"]:checked');
        if (!gifMostrado && avatarVozTerminada && nombreActual !== '' && avatarSeleccionado) {
            gifMostrado = true;
            reproducirVoz('Bien hecho, ' + nombreActual, () => {
                mostrarGifConSonido();
            });
        }
    }, 500);
}

function verificarCompletado() {
    const nombre = document.getElementById('nombrePersona').value.trim();
    const avatarSeleccionado = document.querySelector('input[name="avatar"]:checked');
    bienHechoNombre = nombre;

    if (nombre !== '' && avatarSeleccionado && avatarVozTerminada && !gifMostrado) {
        iniciarBienHecho(nombre);
    } else if (!avatarVozTerminada || nombre === '' || !avatarSeleccionado) {
        limpiarBienHecho();
    }
}

function validarFormulario() {
    reproducirClick();
    const nombre = document.getElementById('nombrePersona').value.trim();
    const avatarSeleccionado = document.querySelector('input[name="avatar"]:checked');
    
    if (nombre === '') {
        reproducirVoz('Debes escribir tu nombre');
        return;
    }
    
    if (!avatarSeleccionado) {
        reproducirVoz('Selecciona un avatar');
        return;
    }
    
    console.log('Nombre:', nombre);
    console.log('Avatar:', avatarSeleccionado.value);
    localStorage.setItem('nombreUsuario', nombre);
    localStorage.setItem('avatarSeleccionado', avatarSeleccionado.value);
    setTimeout(() => {
        window.location.href = 'bienvenida.html';
    }, 2500);
}

window.addEventListener('DOMContentLoaded', () => {
    const avatares = document.querySelectorAll('input[name="avatar"]');
    avatares.forEach((avatar) => {
        avatar.addEventListener('change', () => {
            reproducirClick();
            avatarVozTerminada = false;
            limpiarBienHecho();
            reproducirVoz('Avatar seleccionado', () => {
                avatarVozTerminada = true;
                verificarCompletado();
            });
        });
    });

    const nombreInput = document.getElementById('nombrePersona');
    nombreInput.addEventListener('input', () => {
        verificarCompletado();
    });

    const pezagua = document.getElementById('pezagua');
    const burbujaPez = document.getElementById('burbuja-pez');
    if (pezagua && burbujaPez) {
        pezagua.addEventListener('click', () => {
            reproducirBurbujaPez();
            burbujaPez.textContent = obtenerMensajePezAleatorio();
            burbujaPez.classList.add('mostrar');
            setTimeout(() => {
                burbujaPez.classList.remove('mostrar');
            }, 1800);
        });
    }
});
