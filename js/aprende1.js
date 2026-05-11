document.addEventListener('DOMContentLoaded', function() {
    const botonesNumeros = document.querySelectorAll('.numero');
    const imagenesContainer = document.getElementById('imagenes-container');

    botonesNumeros.forEach(boton => {
        boton.addEventListener('click', function() {
            const num = parseInt(this.getAttribute('data-num'));
            decirNumero(num);
            mostrarImagenes(num);
        });
    });

    function decirNumero(num) {
        const nombresNumeros = {
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

        // Cancelar cualquier voz anterior para evitar superposiciones
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(nombresNumeros[num]);
        utterance.lang = 'es-ES'; // Español de España
        utterance.volume = 1; // Volumen máximo
        utterance.rate = 1; // Velocidad más rápida
        utterance.pitch = 1; // Tono normal
        window.speechSynthesis.speak(utterance);
    }

    function mostrarImagenes(num) {
        imagenesContainer.innerHTML = '';
        for (let i = 0; i < num; i++) {
            const img = document.createElement('img');
            img.src = 'img/pezperro.webp';
            img.alt = 'Pez perro';
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
});

function toggleMusica() {
    const btn = document.getElementById('boton-musica');
    if (!player) {
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