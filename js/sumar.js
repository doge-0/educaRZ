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

    const numero1 = document.getElementById('numero1');
    const numero2 = document.getElementById('numero2');
    const btnSumar = document.getElementById('btn-sumar');
    const imagenesContainer = document.getElementById('imagenes-container');
    const resultadoTexto = document.getElementById('resultado-texto');
    const botonesNumeros = document.querySelectorAll('.num-btn');

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

    const btnCompletar = document.getElementById('completar-leccion');
    if (btnCompletar) {
        btnCompletar.addEventListener('click', function() {
            localStorage.setItem('leccion_sumar_completada', 'true');
            window.location.href = 'aprende1.html';
        });
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
