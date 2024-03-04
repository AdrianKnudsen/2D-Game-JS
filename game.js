document.addEventListener("DOMContentLoaded", function () {
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");

  let x = 5;
  let y = 5;
  const boxWidth = 30;
  const boxHeight = 50;

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

  function gameLoop() {
    requestAnimationFrame(gameLoop);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "green";
    ctx.fillRect(x, y, boxWidth, boxHeight);
  }

  gameLoop();
});
