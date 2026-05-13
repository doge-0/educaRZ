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
    if (nombresNumeros.hasOwnProperty(numero)) {
        return nombresNumeros[numero];
    }
    return numero.toString();
}

function cargarUsuario() {
    const nombre = localStorage.getItem('nombreUsuario');
    const avatar = localStorage.getItem('avatarSeleccionado');

    if (!nombre || !avatar) {
        console.log('No hay datos de usuario en sumar');
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
    console.log('Usuario cargado en sumar:', nombre, avatar);
}

document.addEventListener('DOMContentLoaded', function() {
    vozMasculina = obtenerVozMasculinaEspañola();
    if (typeof speechSynthesis !== 'undefined') {
        window.speechSynthesis.onvoiceschanged = function() {
            vozMasculina = obtenerVozMasculinaEspañola();
        };
    }

    cargarUsuario();

    // Variables para el desafío
    const botonesNumeros = document.querySelectorAll('.num-btn');
    const btnIniciarDesafio = document.getElementById('btn-iniciar-desafio');
    const desafioContainer = document.getElementById('desafio-suma');
    const num1Desafio = document.getElementById('num-desafio-1');
    const num2Desafio = document.getElementById('num-desafio-2');
    const respuestaSuma = document.getElementById('respuesta-suma');
    const btnEnviarSuma = document.getElementById('enviar-suma');
    const feedbackSuma = document.getElementById('feedback-suma');
    const btnVolverSuma = document.getElementById('btn-volver-suma');
    const btnSiguienteSuma = document.getElementById('btn-siguiente-suma');
    const pezAsistente = document.getElementById('pez-asistente');
    const burbujaPececito = document.getElementById('burbuja-pececito');

    let numerosPresionados = new Set();
    let presionCount = 0;
    let desafioIniciado = false;
    let num1Desafio_val = null;
    let num2Desafio_val = null;
    let mensajeDesafioMostrado = false;
    
    // Mensaje inicial al cargar la página
    setTimeout(() => {
        reproducirVoz('Para tener el desafio debes presionar todos los botones y aprender a sumar');
    }, 500);

    // Rastrear números presionados
    botonesNumeros.forEach(boton => {
        boton.addEventListener('click', function() {
            const num = parseInt(this.textContent);
            numerosPresionados.add(num);
            presionCount += 1;

            if (!mensajeDesafioMostrado && presionCount >= 3) {
                mensajeDesafioMostrado = true;
                reproducirVoz('Presiona todos los números para desbloquear el botón del desafío.');
            }

            if (!desafioIniciado && numerosPresionados.size === botonesNumeros.length) {
                mostrarBotonDesafio();
            }
        });
    });

    function mostrarBotonDesafio() {
        btnIniciarDesafio.classList.remove('oculto');
        reproducirVoz('Vayamos al desafio para ver si aprendiste a sumar');
    }

    function iniciarDesafio() {
        desafioIniciado = true;
        num1Desafio_val = Math.floor(Math.random() * 11);
        num2Desafio_val = Math.floor(Math.random() * 11);
        num1Desafio.textContent = num1Desafio_val;
        num2Desafio.textContent = num2Desafio_val;
        desafioContainer.classList.remove('oculto');
        document.querySelector('.contenedor-principal-suma').classList.add('oculto');
        btnIniciarDesafio.classList.add('oculto');
        reproducirVoz('¡Desafío de suma! Resuelve la operación.');
    }

    function verificarRespuestaSuma() {
        if (num1Desafio_val === null || num2Desafio_val === null) {
            return;
        }

        const respuesta = respuestaSuma.value.trim();
        const respuestaCorrecta = num1Desafio_val + num2Desafio_val;

        if (parseInt(respuesta) === respuestaCorrecta) {
            feedbackSuma.textContent = '¡Muy bien! Puedes pasar a la siguiente lección.';
            feedbackSuma.style.color = '#0b6623';
            btnSiguienteSuma.classList.remove('bloqueado');
            btnSiguienteSuma.disabled = false;

            // Cambiar imagen del pez y mostrar confeti
            if (pezAsistente) {
                pezAsistente.src = 'img/pezgirando.gif';
            }
            mostrarConfeti();

            reproducirVoz('¡Muy bien! Has acertado, ahora puedes pasar a la siguiente lección.');
        } else {
            feedbackSuma.textContent = 'Intenta de nuevo. Recuerda que ' + numeroEnEspanol(num1Desafio_val) + ' más ' + numeroEnEspanol(num2Desafio_val) + ' son ' + numeroEnEspanol(respuestaCorrecta);
            feedbackSuma.style.color = '#b22222';
            reproducirVoz('Parece que te has equivocado, intenta de nuevo.');
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
        
        setTimeout(() => {
            document.querySelectorAll('.confeti').forEach(c => c.remove());
        }, 5000);
    }

    btnIniciarDesafio.addEventListener('click', iniciarDesafio);
    btnEnviarSuma.addEventListener('click', verificarRespuestaSuma);

    btnVolverSuma.addEventListener('click', function() {
        desafioContainer.classList.add('oculto');
        document.querySelector('.contenedor-principal-suma').classList.remove('oculto');
        desafioIniciado = false;
        respuestaSuma.value = '';
        feedbackSuma.textContent = '';
        btnSiguienteSuma.classList.add('bloqueado');
        btnSiguienteSuma.disabled = true;
        btnIniciarDesafio.classList.add('oculto');
        numerosPresionados.clear();
        presionCount = 0;
        mensajeDesafioMostrado = false;
        pezAsistente.src = 'img/Catfish.webp';
        reproducirVoz('Regresaste a la práctica. Presiona todos los números para el desafío.');
    });

    btnSiguienteSuma.addEventListener('click', function() {
        if (!btnSiguienteSuma.disabled) {
            localStorage.setItem('leccion_sumar_completada', 'true');
            window.location.href = 'aprende1.html';
        }
    });

    const numero1 = document.getElementById('numero1');
    const numero2 = document.getElementById('numero2');
    const btnSumar = document.getElementById('btn-sumar');
    const imagenesContainer = document.getElementById('imagenes-container');
    const resultadoTexto = document.getElementById('resultado-texto');

    // Rastrear números presionados y llenar campos
    botonesNumeros.forEach(btn => {
        btn.addEventListener('click', function() {
            const num = parseInt(this.textContent);
            
            // Rastrear para el desafío
            numerosPresionados.add(num);
            presionCount += 1;

            if (!mensajeDesafioMostrado && presionCount >= 3) {
                mensajeDesafioMostrado = true;
                reproducirVoz('Presiona todos los números para desbloquear el botón del desafío.');
            }

            if (!desafioIniciado && numerosPresionados.size === botonesNumeros.length) {
                mostrarBotonDesafio();
            }
            
            // Lógica original para llenar campos
            if (numero1.value === '') {
                numero1.value = num;
                numero1.focus();
                reproducirVoz(numeroEnEspanol(parseInt(num)));
            } else if (numero2.value === '') {
                numero2.value = num;
                reproducirVoz(numeroEnEspanol(parseInt(num)));
                realizarSuma();
            }
        });
    });

    btnSumar.addEventListener('click', realizarSuma);

    numero1.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            numero2.focus();
        }
    });

    numero2.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') realizarSuma();
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

    function realizarSuma() {
        const n1 = parseInt(numero1.value) || 0;
        const n2 = parseInt(numero2.value) || 0;

        if (n1 < 0 || n1 > 10 || n2 < 0 || n2 > 10) {
            reproducirVoz('Los números deben estar entre 0 y 10');
            return;
        }

        const suma = n1 + n2;
        resultadoTexto.textContent = suma;

        const texto = numeroEnEspanol(n1) + ' peces más ' + numeroEnEspanol(n2) + ' peces son ' + numeroEnEspanol(suma) + ' peces';
        reproducirVoz(texto);
        mostrarAjolotes(suma);
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
        mostrarBurbujaPez(texto);
    }

    function mostrarBurbujaPez(texto) {
        if (!burbujaPececito) return;
        burbujaPececito.textContent = texto;
        burbujaPececito.classList.add('mostrar');
        clearTimeout(window.burbujaTimeoutSuma);
        window.burbujaTimeoutSuma = setTimeout(() => {
            burbujaPececito.classList.remove('mostrar');
        }, 4000);
    }

    function mostrarAjolotes(cantidad) {
        imagenesContainer.innerHTML = '';
        for (let i = 0; i < cantidad; i++) {
            const img = document.createElement('img');
            img.src = 'img/Sunfish.webp';
            img.alt = 'Sunfish';
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
        console.log('Reiniciando player de música');
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
