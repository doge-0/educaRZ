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
        utterance.lang = 'es-ES'; // EspaÃ±ol de EspaÃ±a
        utterance.volume = 1; // Volumen mÃ¡ximo
        utterance.rate = 1; // Velocidad mÃ¡s rÃ¡pida
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

let musicaFondo;
let musicaActiva = false;

document.addEventListener('DOMContentLoaded', () => {
    musicaFondo = document.getElementById('musica-fondo');
    const btnMusica = document.getElementById('boton-musica');
    if (btnMusica) {
        btnMusica.addEventListener('click', toggleMusica);
    }
});

function toggleMusica() {
    const btn = document.getElementById('boton-musica');
    if (!musicaFondo) {
        return;
    }

    if (musicaActiva) {
        musicaFondo.pause();
        musicaActiva = false;
        if (btn) {
            btn.setAttribute('aria-label', 'Activar musica');
        }
    } else {
        musicaFondo.play().then(() => {
            musicaActiva = true;
            if (btn) {
                btn.setAttribute('aria-label', 'Pausar musica');
            }
        }).catch(() => {});
    }
}
