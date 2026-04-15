const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// configurações
const TILE_SIZE = 32;
const MAP_COLS = 19;
const MAP_ROWS = 21;

canvas.width = MAP_COLS * TILE_SIZE;
canvas.height = MAP_ROWS * TILE_SIZE;

// estado do jogo
let gameState = 'playing';
let deathStart = 0;

// pontuação
let score = 0;

// vidas (novo sistema)
let lives = 3;

// tempo
let startTime = Date.now();
let ghostSpawned = false;

// mapa (1 = parede, 2 = moeda, 0 = vazio)
const map = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,2,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,1],
  [1,2,1,1,2,1,1,1,2,1,2,1,1,1,2,1,1,2,1],
  [1,2,1,1,2,1,1,1,2,1,2,1,1,1,2,1,1,2,1],
  [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,2,1,1,2,1,2,1,1,1,1,1,2,1,2,1,1,2,1],
  [1,2,2,2,2,1,2,2,2,1,2,2,2,1,2,2,2,2,1],
  [1,1,1,1,2,1,1,1,0,1,0,1,1,1,2,1,1,1,1],
  [0,0,0,1,2,1,0,0,0,0,0,0,0,1,2,1,0,0,0],
  [1,1,1,1,2,1,0,1,1,0,1,1,0,1,2,1,1,1,1],
  [0,0,0,0,2,0,0,1,0,0,0,1,0,0,2,0,0,0,0], 
  [1,1,1,1,2,1,0,1,1,1,1,1,0,1,2,1,1,1,1],
  [0,0,0,1,2,1,0,0,0,0,0,0,0,1,2,1,0,0,0],
  [1,1,1,1,2,1,0,1,1,1,1,1,0,1,2,1,1,1,1],
  [1,2,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,1],
  [1,2,1,1,2,1,1,1,2,1,2,1,1,1,2,1,1,2,1],
  [1,2,2,1,2,2,2,2,2,0,2,2,2,2,2,1,2,2,1],
  [1,1,2,1,2,1,2,1,1,1,1,1,2,1,2,1,2,1,1],
  [1,2,2,2,2,1,2,2,2,1,2,2,2,1,2,2,2,2,1],
  [1,2,1,1,1,1,1,1,2,1,2,1,1,1,1,1,1,2,1],
  [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

// imagens
const images = {};

function loadAssets() {
    const assets = {
        pac_up: 'assets/pacman-up.gif',
        pac_down: 'assets/pacman-down.gif',
        pac_left: 'assets/pacman-left.gif',
        pac_right: 'assets/pacman-right.gif',
        pac_death: 'assets/pacman-death.gif',
        ghost: 'assets/ghost-left.gif',
        map: 'assets/map-clean.png'
    };

    let loaded = 0;
    const total = Object.keys(assets).length;

    for (let key in assets) {
        images[key] = new Image();
        images[key].src = assets[key];
        images[key].onload = () => {
            loaded++;
            if (loaded === total) gameLoop();
        };
    }
}

// jogador
const pacman = {
    x: TILE_SIZE,
    y: TILE_SIZE,
    dir: 'right',
    nextDir: 'right',
    speed: 2
};

// fantasma
const ghost = {
    active: false,
    x: 9 * TILE_SIZE,
    y: 10 * TILE_SIZE,
    speed: 1.5
};

// teclado
window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp') pacman.nextDir = 'up';
    if (e.key === 'ArrowDown') pacman.nextDir = 'down';
    if (e.key === 'ArrowLeft') pacman.nextDir = 'left';
    if (e.key === 'ArrowRight') pacman.nextDir = 'right';
});

// parede
function isWall(col, row) {
    return map[row]?.[col] === 1;
}

// alinhamento
function isAligned() {
    return pacman.x % TILE_SIZE === 0 && pacman.y % TILE_SIZE === 0;
}

// snap grid
function snapToGrid(entity) {
    entity.x = Math.round(entity.x / TILE_SIZE) * TILE_SIZE;
    entity.y = Math.round(entity.y / TILE_SIZE) * TILE_SIZE;
}

// trocar direção
function tryChangeDirection() {
    let col = pacman.x / TILE_SIZE;
    let row = pacman.y / TILE_SIZE;

    let nextCol = col;
    let nextRow = row;

    if (pacman.nextDir === 'up') nextRow--;
    if (pacman.nextDir === 'down') nextRow++;
    if (pacman.nextDir === 'left') nextCol--;
    if (pacman.nextDir === 'right') nextCol++;

    if (!isWall(nextCol, nextRow)) {
        pacman.dir = pacman.nextDir;
    }
}

// movimento pacman
function movePacman() {
    if (isAligned()) {
        tryChangeDirection();

        let col = pacman.x / TILE_SIZE;
        let row = pacman.y / TILE_SIZE;

        let nextCol = col;
        let nextRow = row;

        if (pacman.dir === 'up') nextRow--;
        if (pacman.dir === 'down') nextRow++;
        if (pacman.dir === 'left') nextCol--;
        if (pacman.dir === 'right') nextCol++;

        if (isWall(nextCol, nextRow)) {
            snapToGrid(pacman);
            return;
        }
    }

    if (pacman.dir === 'up') pacman.y -= pacman.speed;
    if (pacman.dir === 'down') pacman.y += pacman.speed;
    if (pacman.dir === 'left') pacman.x -= pacman.speed;
    if (pacman.dir === 'right') pacman.x += pacman.speed;
}

// comer moeda
function eatPellet() {
    if (!isAligned()) return;

    let col = pacman.x / TILE_SIZE;
    let row = pacman.y / TILE_SIZE;

    if (map[row][col] === 2) {
        map[row][col] = 0;
        score += 10;
    }
}

// spawn fantasma
function handleGhostSpawn() {
    const elapsed = (Date.now() - startTime) / 1000;

    if (elapsed > 8 && !ghostSpawned) {
        ghost.active = true;
        ghostSpawned = true;
        snapToGrid(ghost);
    }
}

// fantasma
function updateGhost() {
    if (!ghost.active) return;

    let directions = [
        { x: 0, y: -ghost.speed }, // cima
        { x: 0, y: ghost.speed },  // baixo
        { x: -ghost.speed, y: 0 }, // esquerda
        { x: ghost.speed, y: 0 }   // direita
    ];

    let validMoves = [];

    for (let d of directions) {
        let nx = ghost.x + d.x;
        let ny = ghost.y + d.y;

        let col = Math.floor(nx / TILE_SIZE);
        let row = Math.floor(ny / TILE_SIZE);

        if (!isWall(col, row)) {
            validMoves.push(d);
        }
    }

    // se não tiver saída, não faz nada
    if (validMoves.length === 0) return;

    // escolhe movimento que aproxima do pacman
    let bestMove = validMoves[0];
    let bestDistance = Infinity;

    for (let m of validMoves) {
        let nx = ghost.x + m.x;
        let ny = ghost.y + m.y;

        let dist = Math.hypot(pacman.x - nx, pacman.y - ny);

        if (dist < bestDistance) {
            bestDistance = dist;
            bestMove = m;
        }
    }

    ghost.x += bestMove.x;
    ghost.y += bestMove.y;
}

// morte
function killPacman() {
    gameState = 'dying';
    deathStart = Date.now();
    pacman.speed = 0;
}

// colisão
function checkCollision() {
    if (!ghost.active || gameState !== 'playing') return;

    const dist = Math.hypot(pacman.x - ghost.x, pacman.y - ghost.y);

    if (dist < 20) {
        killPacman();
    }
}

// reset (com vidas)
function resetGame() {
    lives--;

    pacman.x = TILE_SIZE;
    pacman.y = TILE_SIZE;
    pacman.dir = 'right';
    pacman.nextDir = 'right';
    pacman.speed = 2;

    ghost.x = 9 * TILE_SIZE;
    ghost.y = 10 * TILE_SIZE;
    ghost.active = false;

    startTime = Date.now();
    ghostSpawned = false;

    gameState = 'playing';

    if (lives <= 0) {
        alert('game over');
        lives = 3;
        score = 0;
    }
}

// update
function update() {
    if (gameState === 'dying') {
        if (Date.now() - deathStart > 2000) {
            resetGame();
        }
        return;
    }

    movePacman();
    eatPellet();
    handleGhostSpawn();
    updateGhost();
    checkCollision();
}

// desenhar moedas
function drawPellets() {
    for (let r = 0; r < MAP_ROWS; r++) {
        for (let c = 0; c < MAP_COLS; c++) {
            if (map[r][c] === 2) {
                ctx.fillStyle = '#ffd700';
                ctx.beginPath();
                ctx.arc(
                    c * TILE_SIZE + TILE_SIZE / 2,
                    r * TILE_SIZE + TILE_SIZE / 2,
                    3,
                    0,
                    Math.PI * 2
                );
                ctx.fill();
            }
        }
    }
}

// draw
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.drawImage(images.map, 0, 0, canvas.width, canvas.height);

    drawPellets();

    if (gameState === 'dying') {
        ctx.drawImage(images.pac_death, pacman.x, pacman.y, TILE_SIZE, TILE_SIZE);
    } else {
        const sprite = images[`pac_${pacman.dir}`];
        ctx.drawImage(sprite, pacman.x, pacman.y, TILE_SIZE, TILE_SIZE);
    }

    if (ghost.active) {
        ctx.drawImage(images.ghost, ghost.x, ghost.y, TILE_SIZE, TILE_SIZE);
    }

    ctx.fillStyle = 'white';
    ctx.fillText(`score: ${score}`, 10, 20);
    ctx.fillText(`lives: ${lives}`, 10, 40);
}

// loop
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// iniciar
loadAssets();