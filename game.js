document.addEventListener("DOMContentLoaded", function () {
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");

  let x = 10;
  let y = 10;
  const speed = 2;

  document.addEventListener("keydown", function (event) {
    if (event.key === "ArrowRight") {
      x += speed;
    } else if (event.key === "ArrowLeft") {
      x -= speed;
    } else if (event.key === "ArrowUp") {
      y -= speed;
    } else if (event.key === "ArrowDown") {
      y += speed;
    }
  });

  function gameLoop() {
    requestAnimationFrame(gameLoop);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "green";
    ctx.fillRect(x, y, 30, 50);
  }

  gameLoop();
});
