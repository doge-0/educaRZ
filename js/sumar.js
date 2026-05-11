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

document.addEventListener('DOMContentLoaded', function() {
    const numero1 = document.getElementById('numero1');
    const numero2 = document.getElementById('numero2');
    const btnSumar = document.getElementById('btn-sumar');
    const imagenesContainer = document.getElementById('imagenes-container');
    const resultadoTexto = document.getElementById('resultado-texto');
    const botonesNumeros = document.querySelectorAll('.num-btn');
    
    // Agregar funcionalidad a botones de números
    botonesNumeros.forEach(btn => {
        btn.addEventListener('click', function() {
            const num = this.textContent;
            if (numero1.value === '') {
                numero1.value = num;
                numero1.focus();
            } else if (numero2.value === '') {
                numero2.value = num;
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
    
    function realizarSuma() {
        const n1 = parseInt(numero1.value) || 0;
        const n2 = parseInt(numero2.value) || 0;
        
        if (n1 < 0 || n1 > 10 || n2 < 0 || n2 > 10) {
            reproducirVoz('Los números deben estar entre 0 y 10');
            return;
        }
        
        const suma = n1 + n2;
        
        // Actualizar caja de resultado
        resultadoTexto.textContent = suma;
        
        // Reproducir voz con pronunciación más clara
        const texto = nombresNumeros[n1] + ' ajolotes más ' + nombresNumeros[n2] + ' ajolotes son ' + nombresNumeros[suma] + ' ajolotes';
        reproducirVoz(texto);
        
        // Mostrar imágenes
        mostrarAjolotes(suma);
    }
    
    function reproducirVoz(texto) {
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(texto);
        utterance.lang = 'es-ES';
        utterance.volume = 1;
        utterance.rate = 1.2;
        utterance.pitch = 1;
        utterance.voiceURI = 'native';
        window.speechSynthesis.speak(utterance);
    }
    
    function mostrarAjolotes(cantidad) {
        imagenesContainer.innerHTML = '';
        for (let i = 0; i < cantidad; i++) {
            const img = document.createElement('img');
            img.src = 'img/Axolot.webp';
            img.alt = 'Ajolote';
            imagenesContainer.appendChild(img);
        }
    }
    
    // Botón completar lección
    const btnCompletar = document.getElementById('completar-leccion');
    if (btnCompletar) {
        btnCompletar.addEventListener('click', function() {
            localStorage.setItem('leccion_sumar_completada', 'true');
            window.location.href = 'aprende1.html';
        });
    }
});

// Música de fondo
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
