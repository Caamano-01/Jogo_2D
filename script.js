// captura o lemento canvas
const canvas = document.getElementById('canvas');
// cria contexto 2d
const ctx = canvas.getContext('2d');

// responsividade
function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx.imageSmoothingEnabled = false;
}
window.addEventListener('resize', resize);
resize();

// carregamento de assets
const playerImage = new Image();
playerImage.src = 'assets/luigi.png';

const mapaImage = new Image();
mapaImage.src = 'assets/mapa_1-1.png';

// dimensões de cada frame do luigi
const spriteWidth = 83.3;
const spriteHeight = 123;

let gameFrame = 0;
const animationSpeed = 5; // quanto maior, mais lenta a animação

// estado do jogador e câmera
const player = {
    x: 100,
    y: 0,
    width: 64,  
    height: 90,
    frameX: 0,
    frameY: 0,
    speed: 6,
    moving: false,
    lookingLeft: false,
    // Física do Pulo
    vy: 0,
    gravity: 0.8,
    jumpForce: -16,
    grounded: false
};

const camera = {
    x: 0
};

// controle de teclado
const keys = {};
window.addEventListener('keydown', e => keys[e.code] = true);
window.addEventListener('keyup', e => keys[e.code] = false);

// loop de animação principal
function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // lógica de direção e movimento
    player.moving = false;
    if (keys['ArrowRight']) {
        player.x += player.speed;
        player.moving = true;
        player.lookingLeft = false;
    } else if (keys['ArrowLeft']) {
        player.x -= player.speed;
        player.moving = true;
        player.lookingLeft = true;
    }

    // lógica de pulo
    if ((keys['ArrowUp'] || keys['Space']) && player.grounded) {
        player.vy = player.jumpForce;
        player.grounded = false;
    }

    // aplicando gravidade
    player.vy += player.gravity;
    player.y += player.vy;

    // colisão com o chão do mapa
    const groundLevel = canvas.height - 180; 
    if (player.y > groundLevel) {
        player.y = groundLevel;
        player.vy = 0;
        player.grounded = true;
    }

    // escolha do Frame baseado no estado
    if (!player.grounded) {
        // frame de pulo
        player.frameX = 1;
        player.frameY = 1;
    } else if (player.moving) {
        // animação de caminhada
        player.frameX = 1 + Math.floor(gameFrame / animationSpeed) % 4;
        player.frameY = 0;
    } else {
        // parado
        player.frameX = 0;
        player.frameY = 0;
    }

    // renderização do mapa e personagem
    ctx.drawImage(mapaImage, -camera.x, 0, mapaImage.width * 2.5, canvas.height);

    ctx.save();
    if (player.lookingLeft) {
        // espelha o luigi quando anda para a esquerda
        ctx.translate(player.x - camera.x + player.width, player.y);
        ctx.scale(-1, 1);
        ctx.drawImage(playerImage, player.frameX * spriteWidth, player.frameY * spriteHeight, spriteWidth, spriteHeight, 0, 0, player.width, player.height);
    } else {
        ctx.drawImage(playerImage, player.frameX * spriteWidth, player.frameY * spriteHeight, spriteWidth, spriteHeight, player.x - camera.x, player.y, player.width, player.height);
    }
    ctx.restore();

    gameFrame++;
    requestAnimationFrame(animate);
}

// inicia quando a imagem carregar
mapaImage.onload = animate;