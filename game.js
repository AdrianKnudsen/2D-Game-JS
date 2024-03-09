const context = document.querySelector("canvas").getContext("2d");
const canvas = document.getElementById("gameCanvas");

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
  document.getElementById("startButton").style.display = "none"; // Hides the start button
  window.addEventListener("keydown", controller.keyListener);
  window.addEventListener("keyup", controller.keyListener);
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

const loop = function () {
  if (controller.jump && player.jumping == false) {
    player.yVelocity -= 20;
    player.jumping = true;
  }

  player.xVelocity += 1; // moves the player right
  player.yVelocity += 1.5; // gravity
  player.x += player.xVelocity;
  player.y += player.yVelocity;
  player.xVelocity *= 0.9; // friction
  player.yVelocity *= 0.9; // friction

  // if player is falling below floor line
  if (player.y > 386 - 16 - 32) {
    player.jumping = false;
    player.y = 386 - 16 - 32;
    player.yVelocity = 0;
  }

  // if player goes past right boundary, reset to the left
  if (player.x > 1220) {
    player.x = -20;
    nextFrame();
  }

  // Creates the backdrop for each frame
  context.fillStyle = "#5871CD";
  context.fillRect(0, 0, 1220, 400); // x, y, width, height

  // Creates and fills the cube for each frame
  context.fillStyle = "#B20B0B"; // hex for cube color
  context.beginPath();
  context.rect(player.x, player.y, player.width, player.height);
  context.fill();

  // Create the obstacles for each frame
  // Set the standard obstacle height
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

  // Creates the "ground" for each frame
  context.strokeStyle = "#644B0B";
  context.lineWidth = 30;
  context.beginPath();
  context.moveTo(0, 385);
  context.lineTo(1220, 385);
  context.stroke();

  // call update when the browser is ready to draw again
  window.requestAnimationFrame(loop);
};
