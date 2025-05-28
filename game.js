const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Load the background image for the level
const bgImage = new Image();
bgImage.src = "./Images/cyberbackgroundfor2dgame.png";

// Level width will be set based on the background image width after it loads
let LEVEL_WIDTH = 16000; // fallback value

const context = ctx;

// Timer for score
let timer = 0;

// Set canvas size
context.canvas.height = 500;
context.canvas.width = 800;

// Frame counter for animation or timing
let frameCount = 1;

// Y position of the floor (bottom of the screen minus ground thickness)
const FLOOR_Y = canvas.height - 5;

// Player object with position, size, and movement state
const player = {
  height: 52,
  jumping: true,
  width: 22,
  x: 0,
  xVelocity: 0,
  y: FLOOR_Y - 32,
  yVelocity: 0,
};

// Array to hold all platforms in the level
const platforms = [];

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

// Hide the start button until the background image is loaded
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("startButton").style.display = "none";
});

// Start button event listener (starts the game)
document.getElementById("startButton").addEventListener("click", startGame);

// Generate platforms spaced so the player can jump from one to the next
function generateRandomPlatforms(numPlatforms = 50) {
  platforms.length = 0;

  // Place the starting ledge at the far left edge
  const startLedge = {
    x: 0, // Touches the left wall
    y: 320, // medium height
    width: 120,
    height: 10,
  };
  platforms.push(startLedge);

  // Start with the fixed ledge as the previous platform
  let prevX = startLedge.x;
  let prevY = startLedge.y;
  let minWidth = 60,
    maxWidth = 140;
  let minDX = 80,
    maxDX = 180;
  let minDY = -80,
    maxDY = 60;

  for (let i = 0; i < numPlatforms - 1; i++) {
    const width = Math.floor(Math.random() * (maxWidth - minWidth)) + minWidth;
    // Place the next platform to the right of the previous one
    let x = Math.min(
      prevX + (Math.floor(Math.random() * (maxDX - minDX)) + minDX),
      LEVEL_WIDTH - maxWidth
    );
    // Vary the Y position up or down, but keep it on screen
    let y = prevY + Math.floor(Math.random() * (maxDY - minDY)) + minDY;
    y = Math.max(80, Math.min(y, FLOOR_Y - 60));

    platforms.push({ x, y, width, height: 10 });

    prevX = x;
    prevY = y;
  }
}

// Start or restart the game
function startGame() {
  generateRandomPlatforms();
  window.addEventListener("keydown", controller.keyListener);
  window.addEventListener("keyup", controller.keyListener);
  document.getElementById("startButton").style.display = "none";
  // Place player on the starting ledge (now at the right wall)
  player.x = platforms[0].x + platforms[0].width / 2 - player.width / 2;
  player.y = platforms[0].y - player.height;
  player.xVelocity = 0;
  player.yVelocity = 0;
  player.jumping = true;
  timer = 0;
  frameCount = 1;
  drawCoverScreen(false);
  window.requestAnimationFrame(loop);
}

// Camera X offset for scrolling
let cameraX = 0;

// Main game loop
const loop = function () {
  // Center the camera on the player, but don't scroll past the level edges
  cameraX = player.x + player.width / 2 - canvas.width / 2;
  if (cameraX < 0) cameraX = 0;
  if (cameraX > LEVEL_WIDTH - canvas.width)
    cameraX = LEVEL_WIDTH - canvas.width;

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

  // Handle player input for movement and jumping
  if (controller.left) {
    player.xVelocity -= 1;
  }
  if (controller.right) {
    player.xVelocity += 1;
  }
  if (controller.jump && player.jumping === false) {
    player.yVelocity -= 20;
    player.jumping = true;
  }

  // Apply gravity and friction to the player
  player.yVelocity += 1.3;
  player.xVelocity *= 0.9;

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

  // Draw the player as a red rectangle, centered with the camera
  context.fillStyle = "#B20B0B";
  context.beginPath();
  context.rect(player.x - cameraX, player.y, player.width, player.height);
  context.fill();

  // Draw all platforms, offset by the camera
  context.fillStyle = "#B3B3B3";
  platforms.forEach((platform) => {
    context.fillRect(
      platform.x - cameraX,
      platform.y,
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

  // Update and display the timer/score
  // timer += 1 / 60;
  // const timerDisplay = timer.toFixed(0);
  // context.fillStyle = "#F0F0F0";
  // context.font = "20px Arial";
  // context.fillText(`Score: ${timerDisplay}`, 50, 30);

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
      `Score: ${timer.toFixed(0)}`,
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
  const currentScore = parseInt(timer.toFixed(0));
  updateHighScore(currentScore);
  drawCoverScreen(true);
  document.getElementById("startButton").innerText = "Reset Game";
  document.getElementById("startButton").style.display = "inline-block";
  displayHighScore();
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
  LEVEL_WIDTH = bgImage.width * 20; // Level is 20 background images wide
  generateRandomPlatforms();
  drawCoverScreen();
  displayHighScore();
  document.getElementById("startButton").style.display = "inline-block";
};
