// captura o elemento canvas
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

// mapa por png
let tileMap = [];
let mapWidth = 0;
let mapHeight = 0;

function generateMapFromImage() {
  const tempCanvas = document.createElement("canvas");
  const tctx = tempCanvas.getContext("2d");

  tempCanvas.width = tileset.width;
  tempCanvas.height = tileset.height;

  tctx.drawImage(tileset, 0, 0);

  const data = tctx.getImageData(0, 0, tileset.width, tileset.height).data;

  mapWidth = tileset.width;
  mapHeight = tileset.height;

  for (let y = 0; y < mapHeight; y++) {
    let row = [];

    for (let x = 0; x < mapWidth; x++) {
      let i = (y * mapWidth + x) * 4;

      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];
      let a = data[i + 3];

      let tile = 0;

      if (a === 0) tile = 0;
      else if (r < 50 && g < 50 && b < 50) tile = 1; // chão
      else if (r > 200 && g < 50 && b < 50) tile = 3; // bloco surpresa
      else if (b > 200) tile = 2; // plataforma

      row.push(tile);
    }

    tileMap.push(row);
  }
}

function assetLoaded() {
  loaded++;
  if (loaded === totalAssets) {
    generateMapFromImage();
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
const gravity = 0.5;
const friction = 0.8;

// câmera
const camera = { x: 0 };

// teclado
const keys = {};
window.addEventListener("keydown", (e) => keys[e.code] = true);
window.addEventListener("keyup", (e) => keys[e.code] = false);

// tile baseado em pixel
const tileSize = 4;

function getTile(x, y) {
  if (y < 0 || y >= mapHeight) return 0;
  if (x < 0 || x >= mapWidth) return 0;
  return tileMap[y][x];
}

function getMapOffsetY() {
  return canvas.height - mapHeight * tileSize;
}

const MAP_SCALE = 3;

// moedas
const coins = [];
let score = 0;

// animação
const sprite = {
  frame: 0,
  timer: 0,
  speed: 0.2,
  state: "idle"
};

const animations = {
  idle: [{ x: 0, y: 0, w: 118, h: 198 }],
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

  // colisão horizontal
  player.x += player.vx;

  let startX = Math.floor(player.x / tileSize);
  let endX = Math.floor((player.x + player.width) / tileSize);
  let startY = Math.floor((player.y - getMapOffsetY()) / tileSize);
  let endY = Math.floor((player.y + player.height - getMapOffsetY()) / tileSize);

  for (let y = startY; y <= endY; y++) {
    for (let x = startX; x <= endX; x++) {

      let tile = getTile(x, y);

      if (tile === 1 || tile === 3) {
        let tileX = x * tileSize;
        let tileY = getMapOffsetY() + y * tileSize;

        if (
          player.x < tileX + tileSize &&
          player.x + player.width > tileX &&
          player.y < tileY + tileSize &&
          player.y + player.height > tileY
        ) {
          if (player.vx > 0) player.x = tileX - player.width;
          else if (player.vx < 0) player.x = tileX + tileSize;
        }
      }
    }
  }

  // colisão vertical
  player.y += player.vy;
  player.grounded = false;

  startX = Math.floor(player.x / tileSize);
  endX = Math.floor((player.x + player.width) / tileSize);
  startY = Math.floor((player.y - getMapOffsetY()) / tileSize);
  endY = Math.floor((player.y + player.height - getMapOffsetY()) / tileSize);

  for (let y = startY; y <= endY; y++) {
    for (let x = startX; x <= endX; x++) {

      let tile = getTile(x, y);

      let tileX = x * tileSize;
      let tileY = getMapOffsetY() + y * tileSize;

      if (tile === 1 || tile === 3) {
        if (
          player.x < tileX + tileSize &&
          player.x + player.width > tileX &&
          player.y < tileY + tileSize &&
          player.y + player.height > tileY
        ) {
          if (player.vy > 0) {
            player.y = tileY - player.height;
            player.vy = 0;
            player.grounded = true;
          } else if (player.vy < 0) {

            // bloco surpresa
            if (tile === 3) {
              coins.push({
                x: tileX,
                y: tileY,
                vy: -6,
                life: 40,
                frame: 0
              });

              tileMap[y][x] = 1;
            }

            player.y = tileY + tileSize;
            player.vy = 0;
          }
        }
      }

      // plataforma
      if (tile === 2) {
        if (
          player.vy > 0 &&
          player.y + player.height <= tileY + 10 &&
          player.x + player.width > tileX &&
          player.x < tileX + tileSize &&
          player.y + player.height >= tileY
        ) {
          player.y = tileY - player.height;
          player.vy = 0;
          player.grounded = true;
        }
      }
    }
  }

  player.vx *= friction;

  // câmera
  camera.x += ((player.x - canvas.width / 2) - camera.x) * 0.1;

  // animação
  if (!player.grounded) sprite.state = "jump";
  else if (player.vx !== 0) sprite.state = player.vx > 0 ? "runRight" : "runLeft";
  else sprite.state = "idle";
}

// animação sprite
function updateAnimation() {
  sprite.timer += sprite.speed;
  if (sprite.timer >= 1) {
    sprite.frame++;
    sprite.timer = 0;

    let anim = animations[sprite.state];
    if (sprite.frame >= anim.length) sprite.frame = 0;
  }
}

// mapa
function drawMap() {
  ctx.drawImage(
    tileset,
    -camera.x,
    canvas.height - tileset.height * MAP_SCALE,
    tileset.width * MAP_SCALE,
    tileset.height * MAP_SCALE
  );
}

// player
function drawPlayer() {
  const anim = animations[sprite.state];
  const frame = anim[sprite.frame];

  ctx.drawImage(
    luigi,
    frame.x, frame.y, frame.w, frame.h,
    player.x - camera.x,
    player.y,
    player.width,
    player.height
  );
}

// debug tiles
function drawTilesDebug() {
  for (let y = 0; y < mapHeight; y++) {
    for (let x = 0; x < mapWidth; x++) {

      let tile = tileMap[y][x];
      if (tile === 0) continue;

      let px = x * tileSize - camera.x;
      let py = getMapOffsetY() + y * tileSize;

      if (tile === 1) ctx.fillStyle = "green";
      if (tile === 2) ctx.fillStyle = "blue";
      if (tile === 3) ctx.fillStyle = "yellow";

      ctx.fillRect(px, py, tileSize, tileSize);
    }
  }
}

// HUD
function drawHUD() {
  ctx.fillStyle = "white";
  ctx.font = "20px Arial";
  ctx.fillText("Moedas: " + score, 20, 30);
}

// loop
function loop() {
  update();
  updateAnimation();

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawMap();
  drawPlayer();
  drawTilesDebug();
  drawHUD();

  requestAnimationFrame(loop);
}