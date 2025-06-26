const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Load the background image for the level
const bgImage = new Image();
bgImage.src = "./Images/cyberbackgroundfor2dgame.png";

// Level width will be set based on the background image width after it loads
let LEVEL_WIDTH = 16000; // fallback value

// Timer for score
let timer = 0;

// Points variable (was coinScore)
let coinScore = 0;

// Frame counter for animation or timing
let frameCount = 60;

// Last timestamp for frame rate control
let lastTimestamp = 0;

// Set canvas size
canvas.height = 500;
canvas.width = 1000;

const context = ctx;

// Y position of the floor (bottom of the screen minus ground thickness)
const FLOOR_Y = canvas.height - 5;

// Player object with position, size, and movement state
const player = {
  x: 0,
  y: FLOOR_Y - 64,
  xVelocity: 0,
  yVelocity: 0,
  jumping: true,
  width: 46, // width of one frame in the sprite sheet
  height: 50, // height of one frame in the sprite sheet
  frameX: 0, // current frame index (column)
  frameY: 3, // row index for running (bottom row, zero-based)
  frameCount: 8, // number of frames in the run animation (bottom row)
  frameTimer: 0,
  frameInterval: 2, // how many game frames to wait before advancing animation
};

// Array to hold all platforms in the level
const platforms = [];

// Array to hold coins (points)
const coins = [];

// Keyboard controller for movement and jumping
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

// Preload the player image for later use
const playerImage = new Image();
playerImage.src = "./Images/playerspritemapv9.png";

// Hide the start button until the background image is loaded
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("startButton").style.display = "none";
});

// Start button event listener (starts the game)
document.getElementById("startButton").addEventListener("click", startGame);

// Generate platforms spaced so the player can jump from one to the next
function generateRandomPlatforms(numPlatforms = 100) {
  platforms.length = 0;
  coins.length = 0; // Clear coins

  // Place the starting ledge at the far left edge
  const startLedge = {
    x: 0,
    y: 320,
    width: 120,
    height: 10,
  };
  platforms.push(startLedge);

  let prevX = startLedge.x;
  let prevY = startLedge.y;
  let minWidth = 60,
    maxWidth = 140;
  let minDX = 100,
    maxDX = 220; // horizontal distance between platforms
  let minDY = -20,
    maxDY = 10; // vertical distance (negative = up)
  let minGap = 20; // Minimum horizontal gap between platforms

  for (let i = 0; i < numPlatforms - 1; i++) {
    // Gradually increase maxDX for more challenge
    let progress = i / numPlatforms;
    let dynamicMaxDX = maxDX + progress * 100; // up to 100px more at the end
    const width = Math.floor(Math.random() * (maxWidth - minWidth)) + minWidth;

    // Ensure platforms do not touch: start after previous platform's right edge + minGap
    let minX = prevX + platforms[platforms.length - 1].width + minGap;
    let maxX = Math.min(minX + (dynamicMaxDX - minDX), LEVEL_WIDTH - maxWidth);
    let x = Math.floor(Math.random() * (maxX - minX + 1)) + minX;

    // Keep vertical gaps reasonable
    let dy = Math.floor(Math.random() * (maxDY - minDY)) + minDY;
    let y = prevY + dy;
    y = Math.max(80, Math.min(y, FLOOR_Y - 60));

    // 20% chance to make the platform moving
    const moving = Math.random() < 0.2;
    const moveRange = 80 + Math.random() * 80; // how far it moves left/right
    const baseX = x; // original x position

    // Calculate movement bounds for this platform
    const newMin = moving ? baseX - moveRange : x;
    const newMax = moving ? baseX + moveRange + width : x + width;

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

      if (Math.random() < 0.3) {
        coins.push({
          x: x + width / 2 - 10,
          y: y - 20,
          radius: 10,
          collected: false,
          spin: Math.random() * Math.PI * 2,
        });
      }

      prevX = x;
      prevY = y;
    }
  }
}

// Start or restart the game
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
  coinScore = 0; // Reset points on restart
  frameCount = 1;
  drawCoverScreen(false);
  window.requestAnimationFrame(loop);
}

// Camera X offset for scrolling
let cameraX = 0;

// Main game loop
const loop = function (timestamp) {
  if (!lastTimestamp) lastTimestamp = timestamp;
  let delta = (timestamp - lastTimestamp) / 16.67; // 16.67ms ≈ 60fps, so delta ≈ 1 at 60fps
  lastTimestamp = timestamp;

  // Center the camera on the player, but don't scroll past the level edges
  cameraX = player.x + player.width / 2 - canvas.width / 2;
  if (cameraX < 0) cameraX = 0;
  if (cameraX > LEVEL_WIDTH - canvas.width)
    cameraX = LEVEL_WIDTH - canvas.width;

  // Camera Y offset for vertical scrolling
  let cameraY = player.y + player.height / 2 - canvas.height / 2;
  if (cameraY < 0) cameraY = 0;
  if (cameraY > FLOOR_Y - canvas.height) cameraY = FLOOR_Y - canvas.height;

  // Draw enough background tiles to cover the visible area, scrolling with the camera
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

  // Use delta to scale all physics/movement:
  if (controller.left) {
    player.xVelocity -= 1 * delta;
  }
  if (controller.right) {
    player.xVelocity += 1 * delta;
  }
  if (controller.jump && player.jumping === false) {
    player.yVelocity -= 22;
    player.jumping = true;
  }

  // Apply gravity and friction to the player
  player.yVelocity += 1.3 * delta;
  player.xVelocity *= Math.pow(0.9, delta);

  // Store previous Y position for collision checks
  let prevY = player.y - player.yVelocity;

  // Update player position
  player.x += player.xVelocity;
  player.y += player.yVelocity;

  // Check for collisions with platforms (only when falling yet)
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

  // Prevent the player from falling through the floor
  if (player.y > FLOOR_Y - player.height) {
    player.jumping = false;
    player.y = FLOOR_Y - player.height;
    player.yVelocity = 0;
    endGame(); // End the game if player touches the floor
    return; // Stop the loop
  }

  // Prevent the player from moving off the left edge of the screen
  if (player.x < 0) {
    player.x = 0;
    player.xVelocity = 0;
  }

  // Animate player (simple run cycle)
  if (controller.left || controller.right) {
    player.frameTimer++;
    if (player.frameTimer >= player.frameInterval) {
      player.frameX = (player.frameX + 1) % player.frameCount;
      player.frameTimer = 0;
    }
  } else {
    player.frameX = 0; // idle frame (first frame of run)
  }

  // Only draw if image is loaded
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

  // Move moving platforms
  platforms.forEach((platform) => {
    if (platform.moving) {
      platform.x += platform.direction * platform.speed * delta;
      if (
        platform.x > platform.baseX + platform.moveRange ||
        platform.x < platform.baseX - platform.moveRange
      ) {
        platform.direction *= -1; // Reverse direction when reaching limits
      }
    }
  });

  // Draw all platforms, offset by the camera
  context.fillStyle = "#B3B3B3";
  platforms.forEach((platform) => {
    context.fillRect(
      platform.x - cameraX,
      platform.y - cameraY,
      platform.width,
      platform.height
    );
  });

  // Draw the ground as a blue line at the bottom
  context.strokeStyle = "#0c6cac";
  context.lineWidth = 10;
  context.beginPath();
  context.moveTo(0, FLOOR_Y);
  context.lineTo(canvas.width, FLOOR_Y);
  context.stroke();

  // Draw and animate coins (points)
  coins.forEach((coin) => {
    if (!coin.collected) {
      // Simple spinning effect using scale
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

  // Point collection
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

  // Draw points at top left
  context.fillStyle = "#FFD700";
  context.font = "22px Arial";
  context.fillText(`Points: ${coinScore}`, 50, 60);

  window.requestAnimationFrame(loop);
};

// Draw the cover screen (welcome or game over)
function drawCoverScreen(gameOver = false) {
  context.fillStyle = "#5871CD";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#f0f0f0";
  context.font = "30px Arial";
  context.textAlign = "center";
  if (gameOver) {
    context.fillText("Game Over", canvas.width / 2, canvas.height / 2);
    context.fillText(
      `Points: ${coinScore}`,
      canvas.width / 2,
      canvas.height / 2 + 40
    );
    // Show reset button
    document.getElementById("startButton").innerText = "Reset Game";
    document.getElementById("startButton").style.display = "inline-block";
  } else {
    context.fillText(
      "Welcome to the Game",
      canvas.width / 2,
      canvas.height / 2
    );
    // Initial state for start button
    document.getElementById("startButton").innerText = "Start Game";
  }
}

// End the game and show the cover screen with the score
function endGame() {
  updateHighScore(coinScore);
  displayHighScore();
  drawCoverScreen(true);
  document.getElementById("startButton").innerText = "Reset Game";
  document.getElementById("startButton").style.display = "inline-block";
}

// Update the high score in local storage if the current score is higher
function updateHighScore(currentScore) {
  let highScore = localStorage.getItem("highScore")
    ? parseInt(localStorage.getItem("highScore"))
    : 0;
  if (currentScore > highScore) {
    localStorage.setItem("highScore", currentScore.toString());
  }
  return highScore;
}

// Display the high score on the screen
function displayHighScore() {
  let highScore = localStorage.getItem("highScore")
    ? localStorage.getItem("highScore")
    : "0";
  document.getElementById("highScoreDisplay").innerText =
    "High Score: " + highScore;
}

// When the background image loads, set up the level and show the start button
bgImage.onload = function () {
  LEVEL_WIDTH = bgImage.width * 50; // Level is 50 background images wide
  generateRandomPlatforms();
  drawCoverScreen();
  displayHighScore();
  document.getElementById("startButton").style.display = "inline-block";
};
