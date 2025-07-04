// =======================================================
// =============== CYBER LEAP - MAIN GAME FILE ===========
// =======================================================

// ===================[ CONSTANTS & GLOBALS ]===================

// Canvas setup
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.height = 500;
canvas.width = 1000;
const context = ctx;

// Images
const coverImage = new Image();
coverImage.src = "./Images/cyberleapcover.png";
const bgImage = new Image();
bgImage.src = "./Images/cyberbackgroundfor2dgame.png";
const gameOverImage = new Image();
gameOverImage.src = "./Images/cyberleapgameover.png";
const playerImage = new Image();
playerImage.src = "./Images/playerspritemapv9.png";

// Level and game state
let LEVEL_WIDTH = 16000;
let FLOOR_Y = canvas.height - 5;
let timer = 0;
let coinScore = 0;
let frameCount = 60;
let lastTimestamp = 0;
let cameraX = 0;

// ===================[ GAME OBJECTS ]===================

// Player object
const player = {
  x: 0,
  y: FLOOR_Y - 64,
  xVelocity: 0,
  yVelocity: 0,
  jumping: true,
  width: 46,
  height: 50,
  frameX: 0,
  frameY: 3,
  frameCount: 8,
  frameTimer: 0,
  frameInterval: 2,
};

// Arrays for platforms and coins
const platforms = [];
const coins = [];

// ===================[ INPUT HANDLING ]===================

const controller = {
  left: false,
  right: false,
  jump: false,
  keyListener: function (event) {
    const key_state = event.type === "keydown";
    switch (event.code) {
      case "ArrowLeft":
        controller.left = key_state;
        break;
      case "ArrowRight":
        controller.right = key_state;
        break;
      case "ArrowUp":
        controller.jump = key_state;
        break;
    }
  },
};

// ===================[ UI & EVENT HOOKS ]===================

// Hide the start button until the background image is loaded
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("startButton").style.display = "none";
});

// Start button event listener (starts the game)
document.getElementById("startButton").addEventListener("click", startGame);

// ===================[ PLATFORM & COIN GENERATION ]===================

function generateRandomPlatforms(numPlatforms = 100) {
  platforms.length = 0;
  coins.length = 0;

  // Place the starting ledge at the far left edge
  const startLedge = {
    x: 0,
    y: 320,
    width: 120,
    height: 10,
  };
  platforms.push(startLedge);

  // Platform generation variables
  let prevX = startLedge.x;
  let prevY = startLedge.y;
  let minWidth = 60,
    maxWidth = 140;
  let minDX = 100,
    maxDX = 220;
  let minDY = -20,
    maxDY = 10;
  let minGap = 20;

  let coinCount = 0;
  let skipNextCoin = false; // Ensures no adjacent coins
  let attempts = 0;

  // Generate platforms until there are 100 coins
  while (coinCount < 100 && attempts < 10000) {
    attempts++;
    let progress = platforms.length / Math.max(numPlatforms, 100);
    let dynamicMaxDX = maxDX + progress * 100;
    const width = Math.floor(Math.random() * (maxWidth - minWidth)) + minWidth;

    let minX = prevX + platforms[platforms.length - 1].width + minGap;
    let maxX = Math.min(minX + (dynamicMaxDX - minDX), LEVEL_WIDTH - maxWidth);
    let x = Math.floor(Math.random() * (maxX - minX + 1)) + minX;

    let dy = Math.floor(Math.random() * (maxDY - minDY)) + minDY;
    let y = prevY + dy;
    y = Math.max(80, Math.min(y, FLOOR_Y - 60));

    // 20% chance to make the platform moving
    const moving = Math.random() < 0.2;
    const moveRange = 80 + Math.random() * 80;
    const baseX = x;

    // Calculate movement bounds for this platform
    const newMin = moving ? baseX - moveRange : x;
    const newMax = moving ? baseX + moveRange + width : x + width;

    // Check for overlap with any other platform's range (moving or static)
    let overlap = false;
    for (let p of platforms) {
      if (Math.abs(p.y - y) < 30) {
        const pMin = p.moving ? p.baseX - p.moveRange : p.x;
        const pMax = p.moving ? p.baseX + p.moveRange + p.width : p.x + p.width;
        if (!(newMax < pMin || newMin > pMax)) {
          overlap = true;
          break;
        }
      }
    }

    // Only add platform if it doesn't overlap
    if (!overlap) {
      platforms.push({
        x,
        y,
        width,
        height: 10,
        moving,
        moveRange,
        baseX,
        direction: 1,
        speed: 1 + Math.random() * 1.5,
      });

      // Place a coin if not skipping (never on adjacent platforms)
      if (!skipNextCoin && coinCount < 100) {
        coins.push({
          x: x + width / 2 - 10,
          y: y - 20,
          radius: 10,
          collected: false,
          spin: Math.random() * Math.PI * 2,
        });
        coinCount++;
        skipNextCoin = true; // Skip the next platform
      } else {
        skipNextCoin = false;
      }

      prevX = x;
      prevY = y;
    }
  }
  if (attempts >= 10000) {
    console.warn("Platform generation stopped after too many attempts.");
  }
}

// ===================[ GAME START/RESET ]===================

function startGame() {
  generateRandomPlatforms(100);
  window.addEventListener("keydown", controller.keyListener);
  window.addEventListener("keyup", controller.keyListener);
  document.getElementById("startButton").style.display = "none";
  // Place player on the starting ledge
  player.x = platforms[0].x + platforms[0].width / 2 - player.width / 2;
  player.y = platforms[0].y - player.height;
  player.xVelocity = 0;
  player.yVelocity = 0;
  player.jumping = true;
  timer = 0;
  coinScore = 0;
  frameCount = 1;
  drawCoverScreen(false);
  window.requestAnimationFrame(loop);
}

// ===================[ MAIN GAME LOOP ]===================

const loop = function (timestamp) {
  // --- Delta time calculation ---
  if (!lastTimestamp) lastTimestamp = timestamp;
  let delta = (timestamp - lastTimestamp) / 16.67;
  lastTimestamp = timestamp;

  // --- Camera logic ---
  cameraX = player.x + player.width / 2 - canvas.width / 2;
  if (cameraX < 0) cameraX = 0;
  if (cameraX > LEVEL_WIDTH - canvas.width)
    cameraX = LEVEL_WIDTH - canvas.width;
  let cameraY = player.y + player.height / 2 - canvas.height / 2;
  if (cameraY < 0) cameraY = 0;
  if (cameraY > FLOOR_Y - canvas.height) cameraY = FLOOR_Y - canvas.height;

  // --- Draw background ---
  const bgTiles = Math.ceil(canvas.width / bgImage.width) + 2;
  for (let i = 0; i < bgTiles; i++) {
    context.drawImage(
      bgImage,
      i * bgImage.width - (cameraX % bgImage.width),
      0,
      bgImage.width,
      canvas.height
    );
  }

  // --- Player input & physics ---
  if (controller.left) player.xVelocity -= 1 * delta;
  if (controller.right) player.xVelocity += 1 * delta;
  if (controller.jump && player.jumping === false) {
    player.yVelocity -= 12 * delta;
    player.jumping = true;
  }
  player.yVelocity += 1.3 * delta;
  player.xVelocity *= Math.pow(0.9, delta);

  // --- Player movement & collision ---
  let prevY = player.y - player.yVelocity;
  player.x += player.xVelocity;
  player.y += player.yVelocity;

  // Platform collision (only when falling)
  platforms.forEach((platform) => {
    if (
      prevY + player.height <= platform.y &&
      player.y + player.height >= platform.y &&
      player.x + player.width > platform.x &&
      player.x < platform.x + platform.width &&
      player.yVelocity >= 0
    ) {
      player.y = platform.y - player.height;
      player.yVelocity = 0;
      player.jumping = false;
    }
  });

  // --- World boundaries ---
  if (player.y > FLOOR_Y - player.height) {
    player.jumping = false;
    player.y = FLOOR_Y - player.height;
    player.yVelocity = 0;
    endGame();
    return;
  }
  if (player.x < 0) {
    player.x = 0;
    player.xVelocity = 0;
  }

  // --- Player animation ---
  if (controller.left || controller.right) {
    player.frameTimer++;
    if (player.frameTimer >= player.frameInterval) {
      player.frameX = (player.frameX + 1) % player.frameCount;
      player.frameTimer = 0;
    }
  } else {
    player.frameX = 0;
  }

  // --- Draw player ---
  if (playerImage.complete && playerImage.naturalWidth !== 0) {
    context.drawImage(
      playerImage,
      player.frameX * player.width,
      player.frameY * player.height,
      player.width,
      player.height,
      player.x - cameraX,
      player.y - cameraY,
      player.width,
      player.height
    );
  }

  // --- Move moving platforms ---
  platforms.forEach((platform) => {
    if (platform.moving) {
      platform.x += platform.direction * platform.speed * delta;
      const leftLimit = platform.baseX - platform.moveRange;
      const rightLimit = platform.baseX + platform.moveRange;

      // If out of bounds, snap to boundary and reverse directions
      if (platform.x > rightLimit) {
        platform.x = rightLimit;
        platform.direction = -1;
      } else if (platform.x < leftLimit) {
        platform.x = leftLimit;
        platform.direction = 1;
      }
    }
  });

  // --- Draw platforms ---
  context.fillStyle = "#B3B3B3";
  platforms.forEach((platform) => {
    context.fillRect(
      platform.x - cameraX,
      platform.y - cameraY,
      platform.width,
      platform.height
    );
  });

  // --- Draw ground ---
  context.strokeStyle = "#0c6cac";
  context.lineWidth = 10;
  context.beginPath();
  context.moveTo(0, FLOOR_Y);
  context.lineTo(canvas.width, FLOOR_Y);
  context.stroke();

  // --- Draw and animate coins ---
  coins.forEach((coin) => {
    if (!coin.collected) {
      coin.spin += 0.1;
      const scale = Math.abs(Math.cos(coin.spin));
      context.save();
      context.translate(
        coin.x - cameraX + coin.radius,
        coin.y - cameraY + coin.radius
      );
      context.scale(scale, 1);
      context.beginPath();
      context.arc(0, 0, coin.radius, 0, 2 * Math.PI);
      context.fillStyle = "#FFD700";
      context.fill();
      context.strokeStyle = "#B29600";
      context.lineWidth = 2;
      context.stroke();
      context.restore();
    }
  });

  // --- Coin collection ---
  coins.forEach((coin) => {
    if (
      !coin.collected &&
      player.x + player.width > coin.x &&
      player.x < coin.x + coin.radius * 2 &&
      player.y + player.height > coin.y &&
      player.y < coin.y + coin.radius * 2
    ) {
      coin.collected = true;
      coinScore += 1;
    }
  });

  // --- Draw score ---
  context.fillStyle = "#FFD700";
  context.font = "22px Arial";
  context.fillText(`Points: ${coinScore}`, 50, 60);

  // --- Next frame ---
  window.requestAnimationFrame(loop);
};

// ===================[ COVER & END SCREENS ]===================

function drawCoverScreen(gameOver = false) {
  if (gameOver) {
    // Game Over screen
    if (gameOverImage.complete && gameOverImage.naturalWidth !== 0) {
      context.drawImage(gameOverImage, 0, 0, canvas.width, canvas.height);
    } else {
      context.fillStyle = "#1b1b1b";
      context.fillRect(0, 0, canvas.width, canvas.height);
    }
    context.textAlign = "center";
    context.fillStyle = "#FFD700";
    context.font = "32px Arial";
    context.fillText(`Points: ${coinScore}`, canvas.width / 2, 430);
    document.getElementById("startButton").innerText = "Reset Game";
    document.getElementById("startButton").style.display = "inline-block";
  } else {
    // Cover screen
    if (coverImage.complete && coverImage.naturalWidth !== 0) {
      context.drawImage(coverImage, 0, 0, canvas.width, canvas.height);
    } else {
      context.fillStyle = "#5871CD";
      context.fillRect(0, 0, canvas.width, canvas.height);
    }
    document.getElementById("startButton").innerText = "Start Game";
    context.textAlign = "center";
  }
}

// ===================[ GAME OVER & HIGH SCORE ]===================

function endGame() {
  updateHighScore(coinScore);
  displayHighScore();
  drawCoverScreen(true);
  document.getElementById("startButton").innerText = "Reset Game";
  document.getElementById("startButton").style.display = "inline-block";
}

function updateHighScore(currentScore) {
  let highScore = localStorage.getItem("highScore")
    ? parseInt(localStorage.getItem("highScore"))
    : 0;
  if (currentScore > highScore) {
    localStorage.setItem("highScore", currentScore.toString());
  }
  return highScore;
}

function displayHighScore() {
  let highScore = localStorage.getItem("highScore")
    ? localStorage.getItem("highScore")
    : "0";
  document.getElementById("highScoreDisplay").innerText =
    "High Score: " + highScore;
}

// ===================[ INITIALIZATION ]===================

bgImage.onload = function () {
  LEVEL_WIDTH = bgImage.width * 50;
  generateRandomPlatforms();
  drawCoverScreen();
  displayHighScore();
  document.getElementById("startButton").style.display = "inline-block";
};

// =======================================================
// ===================[ END OF FILE ]=====================
// =======================================================
