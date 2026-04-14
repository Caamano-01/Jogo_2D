// captura o lemento canvas
const canvas = document.getElementById("canvas");
// cria contexto 2d
const ctx = canvas.getContext("2d");

// responsividade
function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener("resize", resize);
resize();

// carregando assets
const luigi = new Image();
luigi.src = "assets/luigi.png";

const tileset = new Image();
tileset.src = "assets/mapa_1-1.png";

// controle de loading
let loaded = 0;
const totalAssets = 2;

function assetLoaded() {
  loaded++;
  if (loaded === totalAssets) {
    loop();
  }
}

luigi.onload = assetLoaded;
tileset.onload = assetLoaded;

// player
const player = {
  x: 100,
  y: 0,
  width: 60,
  height: 90,
  vx: 0,
  vy: 0,
  speed: 4,
  jump: -12,
  grounded: false
};

// física
const gravity = 0.6;

// câmera
const camera = {
  x: 0,
  y: 0
};

// teclado
const keys = {};
window.addEventListener("keydown", (e) => keys[e.code] = true);
window.addEventListener("keyup", (e) => keys[e.code] = false);

// tilelap (agora real)
const tileSize = 32;

// 0 = vazio | 1 = chão
const map = [
  Array(50).fill(0),
  Array(50).fill(0),
  Array(50).fill(0),
  Array(50).fill(1)
];

// animação de movimentos
const sprite = {
  frame: 0,
  timer: 0,
  speed: 0.2,
  state: "idle"
};

const animations = {
  idle: [
    { x: 0, y: 0, w: 118, h: 198 }
  ],

  runRight: [
    { x: 118, y: 0, w: 62, h: 198 },
    { x: 180, y: 0, w: 62, h: 198 },
    { x: 242, y: 0, w: 62, h: 198 },
    { x: 304, y: 0, w: 62, h: 198 }
  ],

  runLeft: [
    { x: 366, y: 0, w: 62, h: 198 },
    { x: 428, y: 0, w: 62, h: 198 },
    { x: 490, y: 0, w: 62, h: 198 },
    { x: 552, y: 0, w: 62, h: 198 }
  ],

  jump: [
    { x: 0, y: 198, w: 122, h: 175 },
    { x: 122, y: 198, w: 122, h: 175 }
  ]
};

// update
function update() {

  // movimento
  if (keys["ArrowRight"]) player.vx = player.speed;
  else if (keys["ArrowLeft"]) player.vx = -player.speed;
  else player.vx = 0;

  // pulo
  if (keys["Space"] && player.grounded) {
    player.vy = player.jump;
    player.grounded = false;
  }

  // gravidade
  player.vy += gravity;

  player.x += player.vx;
  player.y += player.vy;

  // colisão com chão
  player.grounded = false;

  map.forEach((row, y) => {
    row.forEach((tile, x) => {

      if (tile === 1) {
        let tileX = x * tileSize;
        let tileY = y * tileSize;

        if (
          player.x < tileX + tileSize &&
          player.x + player.width > tileX &&
          player.y < tileY + tileSize &&
          player.y + player.height > tileY
        ) {
          player.y = tileY - player.height;
          player.vy = 0;
          player.grounded = true;
        }
      }

    });
  });

  // estado da animação
  if (!player.grounded) {
    sprite.state = "jump";
  } else if (player.vx !== 0) {
    sprite.state = player.vx > 0 ? "runRight" : "runLeft";
  } else {
    sprite.state = "idle";
  }

  // câmera segue
  camera.x = Math.max(0, player.x - canvas.width / 2);
}

// animação
function updateAnimation() {
  sprite.timer += sprite.speed;

  if (sprite.timer >= 1) {
    sprite.frame++;
    sprite.timer = 0;

    let anim = animations[sprite.state];

    if (sprite.frame >= anim.length) {
      sprite.frame = 0;
    }
  }
}

// desenhar mapa (tileset)
function drawMap() {
  map.forEach((row, y) => {
    row.forEach((tile, x) => {

      if (tile === 1) {
        ctx.drawImage(
          tileset,
          0, 0, 32, 32, // pega o tile do tileset
          x * tileSize - camera.x,
          y * tileSize - camera.y,
          tileSize,
          tileSize
        );
      }

    });
  });
}

// player
function drawPlayer() {
  const anim = animations[sprite.state];

  // segurança: se não existir animação
  if (!anim) return;

  const frame = anim[sprite.frame];

  // segurança: se o frame não existir
  if (!frame) return;

  ctx.drawImage(
    luigi,
    frame.x, frame.y, frame.w, frame.h,
    player.x - camera.x,
    player.y - camera.y,
    player.width,
    player.height
  );
}

// loop
function loop() {
  update();
  updateAnimation();

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawMap();
  drawPlayer();

  requestAnimationFrame(loop);
}