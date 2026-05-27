/* ========= VOZ ========= */

let vozMasculinaContar = null;
let musicaFondo;
let musicaActiva = false;

function obtenerVozMasculinaEspañolaContar(){

    const voces = speechSynthesis.getVoices();

    return voces.find(
        v => v.lang.startsWith('es')
    ) || null;
}

/* ========= HABLAR ========= */

function hablarTexto(texto, alTerminar){

    if(typeof speechSynthesis === 'undefined'){
        mostrarBurbujaPez(texto);
        if(typeof alTerminar === 'function'){
            alTerminar();
        }
        return;
    }

    speechSynthesis.cancel();

    const utterance =
    new SpeechSynthesisUtterance(texto);

    utterance.lang = 'es-ES';

    if(!vozMasculinaContar){
        vozMasculinaContar =
        obtenerVozMasculinaEspañolaContar();
    }

    if(vozMasculinaContar){
        utterance.voice =
        vozMasculinaContar;
    }

    utterance.pitch = 1;
    utterance.rate = 0.92;
    utterance.volume = 1;

    if(typeof alTerminar === 'function'){
        utterance.onend = alTerminar;
        utterance.onerror = alTerminar;
    }

    speechSynthesis.speak(utterance);

    mostrarBurbujaPez(texto);
}

function cargarUsuarioContar(){

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

    if(avatarEl){
        if(avatar && avatarMap[avatar]){
            avatarEl.src = 'img/' + avatarMap[avatar];
            avatarEl.style.display = '';
        }else if(nombre){
            avatarEl.src = 'img/alce.png';
            avatarEl.style.display = '';
        }else{
            avatarEl.removeAttribute('src');
            avatarEl.style.display = 'none';
        }
    }

    if(nombreEl){
        nombreEl.textContent = nombre || '';
    }
}

/* ========= BURBUJA ========= */

function mostrarBurbujaPez(texto){

    const burbuja =
    document.getElementById(
        'burbuja-pececito'
    );

    burbuja.textContent = texto;

    burbuja.style.animation = 'none';

    setTimeout(()=>{

        burbuja.style.animation =
        'burbujaEntrar 0.35s ease';

    },10);
}

/* ========= NUMEROS ========= */

const nombresNumeros = {

    0:'cero',
    1:'uno',
    2:'dos',
    3:'tres',
    4:'cuatro',
    5:'cinco',
    6:'seis',
    7:'siete',
    8:'ocho',
    9:'nueve',
    10:'diez'
};

const pistasNumeros = {

    0:'Pista: este número representa que no hay ningún pez.',
    1:'Pista: este número empieza con la letra u.',
    2:'Pista: este número tiene tres letras.',
    3:'Pista: este número empieza con tr.',
    4:'Pista: este número empieza con cu.',
    5:'Pista: este número termina con o.',
    6:'Pista: este número empieza con s.',
    7:'Pista: este número tiene cinco letras.',
    8:'Pista: este número empieza con o.',
    9:'Pista: este número empieza con n.',
    10:'Pista: este número tiene cuatro letras y empieza con d.'
};

function obtenerPistaNumero(numero, respuestaUsuario){

    if(!respuestaUsuario){
        return 'Pista: escribe el nombre del número con letras.';
    }

    return pistasNumeros[numero] ||
    'Pista: mira el número y escribe su nombre en español.';
}

/* ========= DOM ========= */

document.addEventListener(
'DOMContentLoaded', ()=>{

    vozMasculinaContar =
    obtenerVozMasculinaEspañolaContar();

    if(typeof speechSynthesis !== 'undefined'){
        window.speechSynthesis.onvoiceschanged = function(){
            vozMasculinaContar =
            obtenerVozMasculinaEspañolaContar();
        };
    }

    cargarUsuarioContar();

    const botones =
    document.querySelectorAll('.numero');

    const imagenesContainer =
    document.getElementById(
        'imagenes-container'
    );

    const btnIrDesafio =
    document.getElementById(
        'btn-ir-desafio'
    );

    const leccionContar =
    document.getElementById(
        'leccion-contar'
    );

    const desafio =
    document.getElementById(
        'desafio-contador'
    );

    const numeroRandom =
    document.getElementById(
        'numero-random'
    );

    const respuesta =
    document.getElementById(
        'respuesta-numero'
    );

    const feedback =
    document.getElementById(
        'feedback'
    );

    const btnEnviar =
    document.getElementById(
        'enviar-respuesta'
    );

    const btnSiguiente =
    document.getElementById(
        'btn-siguiente'
    );

    const btnVolver =
    document.getElementById(
        'btn-volver'
    );

    const btnVolverLecciones =
    document.getElementById(
        'btn-volver-lecciones-contar'
    );

    const btnCompletar =
    document.getElementById(
        'completar-leccion'
    );

    const btnMusica = document.getElementById('boton-musica');
    musicaFondo = document.getElementById('musica-fondo');

    let presionados = new Set();

    let numeroDesafio = 0;

    let siguienteNumeroDesbloqueado = 0;

    hablarTexto(
        'Hola. Presiona algunos números para aprender a contar.'
    );

    /* ========= BOTONES ========= */

    botones.forEach(btn=>{

        const num = parseInt(btn.dataset.num);

        if(num !== 0){
            btn.disabled = true;
            btn.classList.add('bloqueado');
        }

        btn.addEventListener(
        'click', ()=>{

            if(btn.disabled){
                return;
            }

            activarMusica();

            hablarTexto(
                nombresNumeros[num],
                ()=>{
                    if(
                        presionados.size ===
                        botones.length
                    ){
                        hablarTexto(
                            'Excelente. Ya puedes ir al desafío.'
                        );
                    }
                }
            );

            mostrarNumero(num);

            presionados.add(num);

            if(num === siguienteNumeroDesbloqueado && num < 10){
                siguienteNumeroDesbloqueado++;
                const botonSiguiente = document.querySelector(`[data-num="${siguienteNumeroDesbloqueado}"]`);
                if(botonSiguiente){
                    botonSiguiente.disabled = false;
                    botonSiguiente.classList.remove('bloqueado');
                }
            }

            if(
                presionados.size ===
                botones.length
            ){

                btnIrDesafio
                .classList
                .remove('oculto');
            }
        });
    });

    /* ========= DESAFIO ========= */

    btnIrDesafio.addEventListener(
    'click', ()=>{

        activarMusica();

        numeroDesafio =
        Math.floor(Math.random()*11);

        numeroRandom.textContent =
        numeroDesafio;

        desafio.classList.remove(
            'oculto'
        );

        if(leccionContar){
            leccionContar.classList.add(
                'oculto'
            );
        }

        hablarTexto(
            'Escribe el nombre del número que aparece en pantalla.'
        );
    });

    /* ========= VERIFICAR ========= */

    btnEnviar.addEventListener(
    'click', ()=>{

        const valor =
        respuesta.value
        .trim()
        .toLowerCase();

        if(
            valor ===
            nombresNumeros[numeroDesafio]
        ){

            feedback.textContent =
            '¡Correcto!';

            feedback.style.color =
            '#0b6623';

            hablarTexto(
                'Muy bien. Has acertado.'
            );

            crearConfetti();

            btnSiguiente.disabled =
            false;

            btnSiguiente.classList.remove(
                'bloqueado'
            );

        }else{

            const pista =
            obtenerPistaNumero(
                numeroDesafio,
                valor
            );

            feedback.textContent =
            pista;

            feedback.style.color =
            '#b22222';

            hablarTexto(
                pista
            );
        }
    });

    if(btnVolver){
        btnVolver.addEventListener(
        'click', ()=>{

            desafio.classList.add(
                'oculto'
            );

            if(leccionContar){
                leccionContar.classList.remove(
                    'oculto'
                );
            }

            respuesta.value = '';
            feedback.textContent = '';

            hablarTexto(
                'Regresaste a la lección. Puedes seguir practicando los números.'
            );
        });
    }

    if(btnSiguiente){
        btnSiguiente.addEventListener(
        'click', ()=>{

            if(btnSiguiente.disabled){
                return;
            }

            localStorage.setItem(
                'leccion_contar_completada',
                'true'
            );

            window.location.href =
            'aprende1.html';
        });
    }

    if(btnVolverLecciones){
        btnVolverLecciones.addEventListener(
        'click', ()=>{

            window.location.href =
            'aprende1.html';
        });
    }

    if(btnCompletar){
        btnCompletar.addEventListener(
        'click', ()=>{

            localStorage.setItem(
                'leccion_contar_completada',
                'true'
            );

            window.location.href =
            'aprende1.html';
        });
    }

    if(btnMusica){
        btnMusica.addEventListener(
        'click',
        toggleMusica
        );
    }

    /* ========= BURBUJAS ========= */

    setInterval(
        crearBurbuja,
        320
    );
});

function toggleMusica(){

    const btn =
    document.getElementById(
        'boton-musica'
    );

    if(!musicaFondo){
        return;
    }

    if(musicaActiva){
        musicaFondo.pause();
        musicaActiva = false;

        if(btn){
            btn.setAttribute('aria-label', 'Activar musica');
        }
    }else{
        activarMusica();
    }
}

function activarMusica(){

    const btn =
    document.getElementById(
        'boton-musica'
    );

    if(!musicaFondo){
        return false;
    }

    musicaFondo.play().then(()=>{
        musicaActiva = true;
        if(btn){
            btn.setAttribute('aria-label', 'Pausar musica');
        }
    }).catch(()=>{});

    return true;
}
/* ========= MOSTRAR PECES ========= */

function mostrarNumero(num){

    const container =
    document.getElementById(
        'imagenes-container'
    );

    container.innerHTML = '';

    const numero =
    document.createElement('div');

    numero.className =
    'numero-animado';

    numero.textContent = num;

    container.appendChild(numero);

    setTimeout(()=>{

        container.innerHTML = '';

        for(let i=0;i<num;i++){

            const img =
            document.createElement('img');

            img.src =
            'img/pezperro.webp';

            img.style.animationDelay =
            `${i*0.08}s`;

            container.appendChild(img);
        }

    },900);
}

/* ========= BURBUJAS ========= */

function crearBurbuja(){

    const bubble =
    document.createElement('div');

    bubble.className =
    'bubble';

    bubble.style.left =
    Math.random()*100 + 'vw';

    const size =
    Math.random()*26 + 10;

    bubble.style.width =
    size + 'px';

    bubble.style.height =
    size + 'px';

    bubble.style.animationDuration =
    (Math.random()*5+5)+'s';

    document.body.appendChild(
        bubble
    );

    setTimeout(()=>{

        bubble.remove();

    },10000);
}

/* ========= CONFETTI ========= */

function crearConfetti(){

    for(let i=0;i<40;i++){

        const confetti =
        document.createElement('div');

        confetti.className =
        'confetti-piece';

        confetti.style.left =
        Math.random()*100 + '%';

        confetti.style.background =
        `hsl(${Math.random()*360},100%,65%)`;

        confetti.style.animationDelay =
        Math.random()*0.5 + 's';

        document.body.appendChild(
            confetti
        );

        setTimeout(()=>{

            confetti.remove();

        },3000);
    }
}

