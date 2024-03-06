document.addEventListener("DOMContentLoaded", function () {
  const startScreen = document.getElementById("gameStartScreen");
  const startButton = document.getElementById("startGameButton");
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");

  let x = 5;
  let y = canvas.height - 50;
  let vy = 0;
  const gravity = 0.5;
  const boxWidth = 30;
  const boxHeight = 50;
  const groundY = canvas.height - boxHeight;

  function initializeGame() {
    document.addEventListener("keydown", function (event) {
      const speed = 20;
      let newX = x;
      let newY = y;

      if (event.key === "ArrowRight") {
        newX += speed;
      } else if (event.key === "ArrowLeft") {
        newX -= speed;
      } else if (event.key === "ArrowUp") {
        newY -= speed;
      } else if (event.key === "ArrowDown") {
        newY += speed;
      }

      if (newX >= 0 && newX + boxWidth <= canvas.width) {
        x = newX;
      }
      if (newY >= 0 && newY + boxHeight <= canvas.height) {
        y = newY;
      }
    });

    gameLoop();
  }

  startButton.addEventListener("click", function () {
    startScreen.style.display = "none";

    initializeGame();
  });

  function gameLoop() {
    requestAnimationFrame(gameLoop);

    vy += gravity;

    y += vy;

    if (y > groundY) {
      y = groundY;
      vy = 0;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "green";
    ctx.fillRect(x, y, boxWidth, boxHeight);
  }
});
