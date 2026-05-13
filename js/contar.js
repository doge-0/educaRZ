document.addEventListener('DOMContentLoaded', function() {
    cargarUsuarioContar();

    const botonesNumeros = document.querySelectorAll('.numero');
    const desafiosContainer = document.getElementById('desafio-contador');
    const numeroRandomEl = document.getElementById('numero-random');
    const respuestaInput = document.getElementById('respuesta-numero');
    const btnEnviarRespuesta = document.getElementById('enviar-respuesta');
    const feedbackEl = document.getElementById('feedback');
    const botonCompletar = document.getElementById('completar-leccion');
    const btnVolver = document.getElementById('btn-volver');
    const btnSiguiente = document.getElementById('btn-siguiente');
    const seccionNumeros = document.querySelector('.numeros');
    const imagenesContainer = document.getElementById('imagenes-container');
    const btnIniciarDesafio = document.getElementById('btn-iniciar-desafio');

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
            hablarTexto('Presiona todos los números para desbloquear el botón del desafío.');
        }

        if (!desafioIniciado && numerosPresionados.size === botonesNumeros.length) {
            mostrarBotonDesafio();
        }
    }

    function iniciarDesafio() {
        desafioIniciado = true;
        numeroDesafio = Math.floor(Math.random() * 11);
        numeroRandomEl.textContent = numeroDesafio;
        desafiosContainer.classList.remove('oculto');
        seccionNumeros.classList.add('oculto');
        imagenesContainer.classList.add('oculto');
        btnIniciarDesafio.classList.add('oculto');
        hablarTexto('¡Desafío listo! Escribe el nombre en español del número que ves en pantalla.');
    }

    function mostrarBotonDesafio() {
        btnIniciarDesafio.classList.remove('oculto');
        btnIniciarDesafio.addEventListener('click', iniciarDesafio);
        hablarTexto('¡Todos los números presionados! Presiona el botón para iniciar el desafío.');
    }

    function mostrarNumeroYImagenes(num) {
        const imagenesContainer = document.getElementById('imagenes-container');
        imagenesContainer.innerHTML = '';

        const numeroElement = document.createElement('div');
        numeroElement.className = 'numero-animado';
        numeroElement.innerHTML = `<div>${num}</div><div style="font-size: 0.6em; margin-top: 10px; color: #666;">${nombresNumeros[num]}</div>`;
        imagenesContainer.appendChild(numeroElement);

        setTimeout(() => {
            imagenesContainer.innerHTML = '';
            for (let i = 0; i < num; i++) {
                const img = document.createElement('img');
                img.src = 'img/pezperro.webp';
                img.alt = 'Pez perro';
                imagenesContainer.appendChild(img);
            }
            const audio = new Audio('sonidos/ladridodeperro.mp3');
            audio.play();
        }, 1000);
    }

    btnEnviarRespuesta.addEventListener('click', function() {
        verificarRespuesta();
    });

    btnVolver.addEventListener('click', function() {
        desafiosContainer.classList.add('oculto');
        seccionNumeros.classList.remove('oculto');
        imagenesContainer.classList.remove('oculto');
        desafioIniciado = false;
        respuestaInput.value = '';
        feedbackEl.textContent = '';
        btnSiguiente.classList.add('bloqueado');
        btnSiguiente.disabled = true;
        btnIniciarDesafio.classList.add('oculto');
        numerosPresionados.clear();
        presionCount = 0;
        mensajeDesafioMostrado = false;
        hablarTexto('Regresaste a los números. Presiona todos para el desafío.');
    });

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
            
            // Cambiar imagen del pez y mostrar confeti
            const pezAsistente = document.getElementById('pez-asistente');
            if (pezAsistente) {
                pezAsistente.src = 'img/pezgirando.gif';
            }
            mostrarConfeti();
            
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

    function mostrarConfeti() {
        const contenedorConfeti = document.getElementById('contenedor-confeti');
        const coloresConfeti = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#F38181', '#AA96DA', '#FCBAD3', '#A8D8EA'];
        
        for (let i = 0; i < 50; i++) {
            const confeti = document.createElement('div');
            confeti.classList.add('confeti');
            confeti.style.left = Math.random() * window.innerWidth + 'px';
            confeti.style.backgroundColor = coloresConfeti[Math.floor(Math.random() * coloresConfeti.length)];
            confeti.style.width = (Math.random() * 10 + 5) + 'px';
            confeti.style.height = confeti.style.width;
            confeti.style.animationDuration = (Math.random() * 2 + 2.5) + 's';
            confeti.style.animationDelay = (Math.random() * 0.3) + 's';
            
            contenedorConfeti.appendChild(confeti);
        }
        
        // Limpiar los confetis después de la animación
        setTimeout(() => {
            document.querySelectorAll('.confeti').forEach(c => c.remove());
        }, 5000);
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
