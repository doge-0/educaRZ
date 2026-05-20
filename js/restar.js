const nombresNumeros = {
    0: 'cero',
    1: 'uno',
    2: 'dos',
    3: 'tres',
    4: 'cuatro',
    5: 'cinco',
    6: 'seis',
    7: 'siete',
    8: 'ocho',
    9: 'nueve',
    10: 'diez',
    11: 'once',
    12: 'doce',
    13: 'trece',
    14: 'catorce',
    15: 'quince',
    16: 'dieciséis',
    17: 'diecisiete',
    18: 'dieciocho',
    19: 'diecinueve',
    20: 'veinte'
};

let vozMasculina = null;

function obtenerVozMasculinaEspañola() {
    const voces = window.speechSynthesis.getVoices();
    const vozPreferida = voces.find(v => v.lang.startsWith('es') && /male|hombre|masculino/i.test(v.name));
    return vozPreferida || voces.find(v => v.lang.startsWith('es')) || null;
}

function numeroEnEspanol(numero) {
    const valor = Math.abs(numero);
    return nombresNumeros.hasOwnProperty(valor) ? nombresNumeros[valor] : valor.toString();
}

function cargarUsuario() {
    const nombre = localStorage.getItem('nombreUsuario');
    const avatar = localStorage.getItem('avatarSeleccionado');

    const avatarMap = {
        avatar1: 'alce.png',
        avatar2: 'leon.png',
        avatar3: 'rana.png',
        avatar4: 'tigre.png'
    };

    const avatarEl = document.getElementById('avatarUsuario');
    const nombreEl = document.getElementById('nombreUsuario');
    if (avatarEl) {
        if (avatar && avatarMap[avatar]) {
            avatarEl.src = 'img/' + avatarMap[avatar];
            avatarEl.style.display = '';
        } else if (nombre) {
            avatarEl.src = 'img/alce.png';
            avatarEl.style.display = '';
        } else {
            avatarEl.removeAttribute('src');
            avatarEl.style.display = 'none';
        }
    }
    if (nombreEl) {
        nombreEl.textContent = nombre || '';
    }
    console.log('Usuario cargado en restar:', nombre, avatar);
}

document.addEventListener('DOMContentLoaded', function() {
    vozMasculina = obtenerVozMasculinaEspañola();
    if (typeof speechSynthesis !== 'undefined') {
        window.speechSynthesis.onvoiceschanged = function() {
            vozMasculina = obtenerVozMasculinaEspañola();
        };
    }

    cargarUsuario();

    const numero1 = document.getElementById('numero1');
    const numero2 = document.getElementById('numero2');
    const btnRestar = document.getElementById('btn-restar');
    const imagenesContainer = document.getElementById('imagenes-container');
    const resultadoTexto = document.getElementById('resultado-texto');
    const botonesNumeros = document.querySelectorAll('.num-btn');
    const btnDesafio = document.getElementById('btn-desafio');
    const leccionResta = document.getElementById('leccion-resta');
    const pantallaDesafioResta = document.getElementById('pantalla-desafio-resta');
    const restaDesafioTexto = document.getElementById('resta-desafio-texto');
    const respuestaDesafio = document.getElementById('respuesta-desafio');
    const verificarDesafio = document.getElementById('verificar-desafio');
    const feedbackDesafio = document.getElementById('feedback-desafio');
    const btnVolverResta = document.getElementById('btn-volver-resta');
    const btnSiguienteResta = document.getElementById('btn-siguiente-resta');
    const btnVolverLeccionesResta = document.getElementById('btn-volver-lecciones-resta');

    let restaCount = 0;
    let desafioIniciado = false;
    let numeroDesafioA = null;
    let numeroDesafioB = null;

    botonesNumeros.forEach(btn => {
        btn.addEventListener('click', function() {
            const num = this.textContent;
            if (numero1.value === '') {
                numero1.value = num;
                numero1.focus();
                reproducirVoz(numeroEnEspanol(parseInt(num)));
            } else if (numero2.value === '') {
                numero2.value = num;
                reproducirVoz(numeroEnEspanol(parseInt(num)));
                realizarResta();
            }
        });
    });

    btnRestar.addEventListener('click', realizarResta);

    numero1.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            numero2.focus();
        }
    });

    numero2.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') realizarResta();
    });

    numero1.addEventListener('input', function() {
        const valor = parseInt(this.value);
        if (!Number.isNaN(valor) && valor >= 0 && valor <= 10) {
            reproducirVoz(numeroEnEspanol(valor));
        }
    });

    numero2.addEventListener('input', function() {
        const valor = parseInt(this.value);
        if (!Number.isNaN(valor) && valor >= 0 && valor <= 10) {
            reproducirVoz(numeroEnEspanol(valor));
        }
    });

    if (btnDesafio) {
        btnDesafio.addEventListener('click', iniciarDesafio);
    }
    if (verificarDesafio) {
        verificarDesafio.addEventListener('click', verificarRespuestaDesafio);
    }
    if (btnVolverResta) {
        btnVolverResta.addEventListener('click', function() {
            pantallaDesafioResta.classList.add('oculto');
            leccionResta.classList.remove('oculto');
            btnDesafio.classList.remove('oculto');
            respuestaDesafio.value = '';
            feedbackDesafio.textContent = '';
            btnSiguienteResta.classList.add('bloqueado');
            btnSiguienteResta.disabled = true;
            desafioIniciado = false;
            hablarTexto('Regresaste a la lección. Sigue restando hasta que aparezca el botón de desafío.');
        });
    }
    if (btnVolverLeccionesResta) {
        btnVolverLeccionesResta.addEventListener('click', function() {
            window.location.href = 'aprende1.html';
        });
    }
    if (btnSiguienteResta) {
        btnSiguienteResta.addEventListener('click', function() {
            if (!btnSiguienteResta.disabled) {
                localStorage.setItem('leccion_restar_completada', 'true');
                window.location.href = 'aprende1.html';
            }
        });
    }

    mostrarMensajeInicio();

    function realizarResta() {
        const n1 = parseInt(numero1.value) || 0;
        const n2 = parseInt(numero2.value) || 0;

        if (n1 < 0 || n1 > 10 || n2 < 0 || n2 > 10) {
            hablarTexto('Los números deben estar entre 0 y 10');
            return;
        }

        const resta = n1 - n2;
        if (resta < 0) {
            resultadoTexto.textContent = '?';
            mostrarAjolotes(0);
            hablarTexto('Eso no lo vamos a ver de momento. Solo vamos a trabajar con restas que den un resultado positivo.');
            return;
        }

        resultadoTexto.textContent = resta;
        const texto = numeroEnEspanol(n1) + ' peces menos ' + numeroEnEspanol(n2) + ' peces son ' + numeroEnEspanol(resta) + ' peces';
        hablarTexto(texto);
        mostrarAjolotes(resta);

        restaCount += 1;
        if (restaCount === 5 && btnDesafio) {
            btnDesafio.classList.remove('oculto');
            hablarTexto('Has hecho cinco restas. Ya puedes presionar el botón de desafío.');
        }
    }

    function mostrarMensajeInicio() {
        hablarTexto('Bienvenido a la lección de restar. Luego de hacer cinco restas tendrás el botón para el desafío.');
    }

    function iniciarDesafio() {
        if (desafioIniciado) return;
        desafioIniciado = true;
        numeroDesafioA = Math.floor(Math.random() * 11);
        numeroDesafioB = Math.floor(Math.random() * (numeroDesafioA + 1));
        restaDesafioTexto.textContent = `${numeroDesafioA} - ${numeroDesafioB}`;
        pantallaDesafioResta.classList.remove('oculto');
        leccionResta.classList.add('oculto');
        btnDesafio.classList.add('oculto');
        respuestaDesafio.value = '';
        feedbackDesafio.textContent = '';
        btnSiguienteResta.classList.add('bloqueado');
        btnSiguienteResta.disabled = true;
        hablarTexto('¡Desafío listo! Resta los dos números y escribe el resultado.');
    }

    function verificarRespuestaDesafio() {
        if (numeroDesafioA === null || numeroDesafioB === null) return;

        const respuesta = parseInt(respuestaDesafio.value.trim(), 10);
        const resultadoCorrecto = numeroDesafioA - numeroDesafioB;

        if (!Number.isNaN(respuesta) && respuesta === resultadoCorrecto) {
            feedbackDesafio.textContent = '¡Muy bien! Ahora puedes pasar a la siguiente lección.';
            feedbackDesafio.style.color = '#0b6623';
            btnSiguienteResta.classList.remove('bloqueado');
            btnSiguienteResta.disabled = false;
            celebrarDesafio();
            hablarTexto('¡Muy bien! Has acertado el desafío.');
        } else {
            let hintText = 'Intenta de nuevo. Resta los dos números y revisa el resultado.';
            if (!Number.isNaN(respuesta)) {
                if (respuesta < resultadoCorrecto) {
                    hintText = 'Pista: tu respuesta es un poco menor. Vuelve a restar los dos números.';
                } else {
                    hintText = 'Pista: tu respuesta es mayor. Prueba con un número más pequeño.';
                }
            }
            feedbackDesafio.textContent = hintText;
            feedbackDesafio.style.color = '#b22222';
            hablarTexto(hintText);
        }
    }

    function celebrarDesafio() {
        const pez = document.getElementById('pez-asistente');
        if (pez) {
            pez.src = 'img/pezgirando.gif';
        }
        crearConfetti();
    }

    function crearConfetti() {
        const total = 35;
        for (let i = 0; i < total; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti-piece';
            confetti.style.left = `${Math.random() * 100}%`;
            confetti.style.backgroundColor = `hsl(${Math.random() * 360}, 100%, 65%)`;
            confetti.style.animationDelay = `${Math.random() * 0.5}s`;
            document.body.appendChild(confetti);
            setTimeout(() => confetti.remove(), 3000);
        }
    }

    function hablarTexto(texto) {
        reproducirVoz(texto);
        mostrarBurbujaPez(texto);
    }

    function mostrarBurbujaPez(texto) {
        const burbuja = document.getElementById('burbuja-pececito');
        if (!burbuja) return;
        burbuja.textContent = texto;
        burbuja.classList.add('mostrar');
        clearTimeout(window.burbujaTimeout);
        window.burbujaTimeout = setTimeout(() => {
            burbuja.classList.remove('mostrar');
        }, 4000);
    }

    function reproducirVoz(texto) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(texto);
        utterance.lang = 'es-ES';
        if (!vozMasculina) {
            vozMasculina = obtenerVozMasculinaEspañola();
        }
        if (vozMasculina) {
            utterance.voice = vozMasculina;
        }
        utterance.volume = 1;
        utterance.rate = 1.2;
        utterance.pitch = 1;
        window.speechSynthesis.speak(utterance);
    }

    function mostrarAjolotes(cantidad) {
        imagenesContainer.innerHTML = '';
        for (let i = 0; i < cantidad; i++) {
            const img = document.createElement('img');
            img.src = 'img/Sunfish.webp';
            img.alt = 'Sunfish';
            img.classList.add('pez-aparecer');
            img.style.animationDelay = `${i * 0.08}s`;
            imagenesContainer.appendChild(img);
        }
    }
});

var player;

function onYouTubeIframeAPIReady() {
    player = new YT.Player('player', {
        height: '0',
        width: '0',
        videoId: '8EczaHDAcXE',
        playerVars: {
            autoplay: 1,
            mute: 1,
            loop: 1,
            playlist: '8EczaHDAcXE'
        },
        events: {
            onReady: onPlayerReady
        }
    });
}

function onPlayerReady(event) {
    event.target.unMute();
    event.target.playVideo();
    const btn = document.getElementById('boton-musica');
    if (btn) {
        btn.textContent = 'Música ON';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const btnMusica = document.getElementById('boton-musica');
    if (btnMusica) {
        btnMusica.addEventListener('click', toggleMusica);
    }
});

function toggleMusica() {
    const btn = document.getElementById('boton-musica');
    if (!player) {
        if (typeof YT !== 'undefined' && YT && YT.Player) {
            onYouTubeIframeAPIReady();
        }
        return;
    }

    if (player.getPlayerState() === YT.PlayerState.PLAYING) {
        player.pauseVideo();
        btn.textContent = 'Música OFF';
    } else {
        player.unMute();
        player.playVideo();
        btn.textContent = 'Música ON';
    }
}
