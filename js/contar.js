let vozMasculinaContar = null;

function obtenerVozMasculinaEspañolaContar() {
    const voces = window.speechSynthesis.getVoices();
    const vozPreferida = voces.find(v => v.lang.startsWith('es') && /male|hombre|masculino/i.test(v.name));
    return vozPreferida || voces.find(v => v.lang.startsWith('es')) || null;
}

document.addEventListener('DOMContentLoaded', function() {
    vozMasculinaContar = obtenerVozMasculinaEspañolaContar();
    if (typeof speechSynthesis !== 'undefined') {
        window.speechSynthesis.onvoiceschanged = function() {
            vozMasculinaContar = obtenerVozMasculinaEspañolaContar();
        };
    }

    cargarUsuarioContar();

    const botonesNumeros = document.querySelectorAll('.numero');
    const btnIrDesafio = document.getElementById('btn-ir-desafio');
    const desafiosContainer = document.getElementById('desafio-contador');
    const numeroRandomEl = document.getElementById('numero-random');
    const respuestaInput = document.getElementById('respuesta-numero');
    const btnEnviarRespuesta = document.getElementById('enviar-respuesta');
    const feedbackEl = document.getElementById('feedback');
    const botonCompletar = document.getElementById('completar-leccion');
    const btnVolver = document.getElementById('btn-volver');
    const btnSiguiente = document.getElementById('btn-siguiente');
    const btnVolverLeccionesContar = document.getElementById('btn-volver-lecciones-contar');
    const seccionNumeros = document.querySelector('.numeros');
    const imagenesContainer = document.getElementById('imagenes-container');

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
        10: 'diez'
    };

    let numerosPresionados = new Set();
    let presionCount = 0;
    let desafioIniciado = false;
    let numeroDesafio = null;
    let mensajeDesafioMostrado = false;

    botonesNumeros.forEach(boton => {
        boton.addEventListener('click', function() {
            const num = parseInt(this.getAttribute('data-num'));
            decirNumero(num);
            mostrarNumeroYImagenes(num);
            registrarNumeroPresionado(num);
        });
    });

    function decirNumero(num) {
        window.speechSynthesis.cancel();
        hablarTexto(nombresNumeros[num]);
    }

    function hablarTexto(texto) {
        const utterance = new SpeechSynthesisUtterance(texto);
        utterance.lang = 'es-ES';
        if (!vozMasculinaContar) {
            vozMasculinaContar = obtenerVozMasculinaEspañolaContar();
        }
        if (vozMasculinaContar) {
            utterance.voice = vozMasculinaContar;
        }
        utterance.volume = 1;
        utterance.rate = 1;
        utterance.pitch = 1;
        window.speechSynthesis.speak(utterance);
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

    function registrarNumeroPresionado(num) {
        presionCount += 1;
        numerosPresionados.add(num);

        if (!mensajeDesafioMostrado && presionCount >= 3) {
            mensajeDesafioMostrado = true;
            hablarTexto('Cuando presiones todos los botones te saldrá un desafío para ver si aprendiste.');
        }

        if (!desafioIniciado && numerosPresionados.size === botonesNumeros.length) {
            if (btnIrDesafio) {
                btnIrDesafio.classList.remove('oculto');
                hablarTexto('¡Muy bien! Presiona el botón para ir al desafío.');
            } else {
                iniciarDesafio();
            }
        }
    }

    function iniciarDesafio() {
        desafioIniciado = true;
        numeroDesafio = Math.floor(Math.random() * 11);
        numeroRandomEl.textContent = numeroDesafio;
        desafiosContainer.classList.remove('oculto');
        seccionNumeros.classList.add('oculto');
        imagenesContainer.classList.add('oculto');
        if (btnIrDesafio) {
            btnIrDesafio.classList.add('oculto');
        }
        hablarTexto('¡Desafío listo! Escribe el nombre en español del número que ves en pantalla.');
    }

    function mostrarNumeroYImagenes(num) {
        const imagenesContainer = document.getElementById('imagenes-container');
        imagenesContainer.innerHTML = '';

        const numeroElement = document.createElement('div');
        numeroElement.className = 'numero-animado';
        numeroElement.textContent = num;
        imagenesContainer.appendChild(numeroElement);

        setTimeout(() => {
            imagenesContainer.innerHTML = '';
            for (let i = 0; i < num; i++) {
                const img = document.createElement('img');
                img.src = 'img/pezperro.webp';
                img.alt = 'Pez perro';
                img.classList.add('pez-aparecer');
                img.style.animationDelay = `${i * 0.08}s`;
                imagenesContainer.appendChild(img);
            }
            const audio = new Audio('sonidos/ladridodeperro.mp3');
            audio.play();
        }, 1000);
    }

    btnEnviarRespuesta.addEventListener('click', function() {
        verificarRespuesta();
    });

    if (btnIrDesafio) {
        btnIrDesafio.addEventListener('click', function() {
            iniciarDesafio();
        });
    }

    btnVolver.addEventListener('click', function() {
        desafiosContainer.classList.add('oculto');
        seccionNumeros.classList.remove('oculto');
        imagenesContainer.classList.remove('oculto');
        desafioIniciado = false;
        respuestaInput.value = '';
        feedbackEl.textContent = '';
        btnSiguiente.classList.add('bloqueado');
        btnSiguiente.disabled = true;
        hablarTexto('Regresaste a los números. Presiona todos para el desafío.');
    });

    if (btnVolverLeccionesContar) {
        btnVolverLeccionesContar.addEventListener('click', function() {
            window.location.href = 'aprende1.html';
        });
    }

    btnSiguiente.addEventListener('click', function() {
        if (!btnSiguiente.disabled) {
            localStorage.setItem('leccion_contar_completada', 'true');
            window.location.href = 'aprende1.html';
        }
    });

    function verificarRespuesta() {
        if (numeroDesafio === null) {
            return;
        }

        const respuesta = respuestaInput.value.trim().toLowerCase();
        const respuestaCorrecta = nombresNumeros[numeroDesafio];

        if (respuesta === respuestaCorrecta) {
            feedbackEl.textContent = '¡Muy bien! Puedes pasar a la siguiente lección.';
            feedbackEl.style.color = '#0b6623';
            btnSiguiente.classList.remove('bloqueado');
            btnSiguiente.disabled = false;
            celebrarDesafioContar();
            hablarTexto('¡Muy bien! Has acertado, ahora puedes pasar a la siguiente lección.');
        } else {
            const primeraLetra = respuestaCorrecta.charAt(0);
            const ultimaLetra = respuestaCorrecta.charAt(respuestaCorrecta.length - 1);
            const texto = `Parece que te has equivocado, ese número empieza por la letra ${primeraLetra} y termina con la ${ultimaLetra}.`;
            feedbackEl.textContent = 'Intenta de nuevo con la pista del pez.';
            feedbackEl.style.color = '#b22222';
            hablarTexto(texto);
        }
    }

    function celebrarDesafioContar() {
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
});

var player;

function onYouTubeIframeAPIReady() {
    player = new YT.Player('player', {
        height: '0',
        width: '0',
        videoId: '8EczaHDAcXE',
        playerVars: {
            'autoplay': 1,
            'mute': 1,
            'loop': 1,
            'playlist': '8EczaHDAcXE'
        },
        events: {
            'onReady': onPlayerReady
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
    
    const btnCompletar = document.getElementById('completar-leccion');
    if (btnCompletar) {
        btnCompletar.addEventListener('click', function() {
            // No hace nada, ya que está oculto
        });
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

function cargarUsuarioContar() {
    const nombre = localStorage.getItem('nombreUsuario');
    const avatar = localStorage.getItem('avatarSeleccionado');
    if (!nombre || !avatar) {
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
