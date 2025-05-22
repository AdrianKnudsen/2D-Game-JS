const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const bgImage = new Image();
bgImage.src = "./images/cyberbackgroundfor2dgame.png";

const context = document.querySelector("canvas").getContext("2d");

// Initialize points score
let timer = 0;

context.canvas.height = 400;
context.canvas.width = 1220;

// Start the frame count at 1
let frameCount = 1;
// Set the number of obstacles to match the current "level"
let obCount = frameCount;
// Create a collection to hold the generated x coordinates
const obXCoors = [];

const player = {
  height: 32,
  jumping: true,
  width: 22,
  x: 0,
  xVelocity: 0,
  y: 385 - 32,
  yVelocity: 0,
};

// Handeling the starting of the game
function startGame() {
  window.addEventListener("keydown", controller.keyListener);
  window.addEventListener("keyup", controller.keyListener);
  document.getElementById("startButton").style.display = "none"; // Hides the start button
  // Reset game state
  timer = 0;
  frameCount = 1;
  obXCoors.length = 0; // Clears obstacles
  // Reset player position
  player.x = 100;
  player.y = 385 - 32;
  player.xVelocity = 0;
  player.yVelocity = 0;
  player.jumping = false;

  window.requestAnimationFrame(loop); // Starts the game loop
}

document.getElementById("startButton").addEventListener("click", startGame);

// Create the obstacles for each frame
const nextFrame = () => {
  // increase the frame / "level" count
  frameCount++;

  for (let i = 0; i < obCount; i++) {
    // Randomly generate the x coordinate for the top corner start of the triangles
    obXCoor = Math.floor(Math.random() * (1165 - 140 + 1) + 140);
    obXCoors.push(obXCoor);
  }
};

const controller = {
  jump: false,
  keyListener: function (event) {
    var key_state = event.type == "keydown" ? true : false;

    if (event.keyCode == 32) {
      // Space bar
      controller.jump = key_state;
    }
  },
};

// Game loop
const loop = function () {
  // Draw the background image
  context.drawImage(bgImage, 0, 0, canvas.width, canvas.height);

  if (controller.jump && player.jumping == false) {
    player.yVelocity -= 20;
    player.jumping = true;
  }

  player.xVelocity += 1; // moves the player right
  player.yVelocity += 2; // gravity
  player.x += player.xVelocity;
  player.y += player.yVelocity;
  player.xVelocity *= 0.9; // friction x-axis
  player.yVelocity *= 0.9; // friction y-axis

  // if player is falling below floor line
  if (player.y > 386 - 16 - 32) {
    player.jumping = false;
    player.y = 386 - 16 - 32;
    player.yVelocity = 0;
  }

  // When player goes past right boundary, reset to the left
  if (player.x > 1220) {
    player.x = -20;
    nextFrame();
  }

  // Creates and fills the cube for each frame
  context.fillStyle = "#B20B0B"; // hex for cube color
  context.beginPath();
  context.rect(player.x, player.y, player.width, player.height);
  context.fill();

  // Create the obstacles for each frame
  const height = 200 * Math.cos(Math.PI / 6);

  context.fillStyle = "#FBF5F3"; // hex for triangle color
  obXCoors.forEach((obXCoor) => {
    context.beginPath();

    context.moveTo(obXCoor, 385); // x = random, y = coor. on "ground"
    context.lineTo(obXCoor + 20, 385); // x = ^random + 20, y = coor. on "ground"
    context.lineTo(obXCoor + 10, 510 - height); // x = ^random + 10, y = peak of triangle

    context.closePath();
    context.fill();
  });

  function checkCollision() {
    const playerBottomY = player.y + player.height;
    const playerRightX = player.x + player.width;

    for (let i = 0; i < obXCoors.length; i++) {
      const obXCoor = obXCoors[i];
      const obWidth = 10;
      const obHeight = 40;

      const triangleTopY = 385 - obHeight;

      if (
        playerRightX >= obXCoor &&
        player.x <= obXCoor + obWidth &&
        playerBottomY >= triangleTopY &&
        player.y <= 385
      ) {
        return true; // Collision detected
      }
    }
    return false; // No collision detected
  }

  // Creates the "ground" for each frame
  context.strokeStyle = "#644B0B";
  context.lineWidth = 30;
  context.beginPath();
  context.moveTo(0, 385);
  context.lineTo(1220, 385);
  context.stroke();

  // Update timer/points
  timer += 1 / 60;

  // Converts the timer to whole numbers
  const timerDisplay = timer.toFixed(0);

  // Timer Css
  context.fillStyle = "#F0F0F0";
  context.font = "20px Arial";
  context.fillText(`Score: ${timerDisplay}`, 50, 30);

  if (checkCollision()) {
    endGame();
    return; // Stops the game loop
  }

  window.requestAnimationFrame(loop);
};

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
    // Show a reset button
    document.getElementById("startButton").innerText = "Reset Game";
    document.getElementById("startButton").style.display = "inline-block";
  } else {
    context.fillText(
      "Welcome to the Game",
      canvas.width / 2,
      canvas.height / 2
    );
    // Initial state for "Start Game" button
    document.getElementById("startButton").innerText = "Start Game";
  }
}

function endGame() {
  const currentScore = parseInt(timer.toFixed(0));
  updateHighScore(currentScore); // Update the high score if the current score is higher
  drawCoverScreen(true);
  document.getElementById("startButton").innerText = "Reset Game";
  document.getElementById("startButton").style.display = "inline-block";
  displayHighScore();
}

document.addEventListener("DOMContentLoaded", () => {
  drawCoverScreen(); // This draws the initial screen
  document.getElementById("startButton").style.display = "inline-block";
});

function updateHighScore(currentScore) {
  // Retrives the high score from local storage or set to 0 if it doesn't exist
  let highScore = localStorage.getItem("highScore")
    ? parseInt(localStorage.getItem("highScore"))
    : 0;

  // Compare the current score with the high score and update if necessary
  if (currentScore > highScore) {
    localStorage.setItem("highScore", currentScore.toString());
  }
  return highScore;
}

function displayHighScore() {
  // Retrieve the high score from local storage or set to 0 if it doesn't exist
  let highScore = localStorage.getItem("highScore")
    ? localStorage.getItem("highScore")
    : "0";

  // Update the high score display element
  document.getElementById("highScoreDisplay").innerText =
    "High Score: " + highScore;
}

// Draw the background image once it's loaded
bgImage.onload = function () {
  ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
};

function gameLoop() {
  ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
  // Draw the rest of the game
  requestAnimationFrame(gameLoop);
}
