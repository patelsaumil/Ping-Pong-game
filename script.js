let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");

let gameMode = null, gameRunning = false, animationId;
let playerLeftName = "Left", playerRightName = "Right";
let leftPaddleY = 160, rightPaddleY = 160;
let paddleHeight = 80;
let ball = { x: 350, y: 200, dx: 5, dy: 3, radius: 10 };
let leftScore = 0, rightScore = 0;
let timer = 60, timerInterval, suddenDeath = false;

let upPressed = false, downPressed = false, wPressed = false, sPressed = false;
let powerUpActive = false, reverseControl = false, shakeTime = 0;

$(document).ready(() => $('#name-modal').modal({ backdrop: 'static', keyboard: false }));

document.getElementById("start-game-btn").onclick = () => {
  playerLeftName = document.getElementById("playerLeft").value.trim() || "Left";
  playerRightName = document.getElementById("playerRight").value.trim() || "Right";
  $('#name-modal').modal('hide');
  document.getElementById("mode-select").style.display = "block";
};

document.getElementById("powerup-mode").onclick = () => { gameMode = "powerup"; startGame(); };
document.getElementById("timer-mode").onclick = () => { gameMode = "timer"; startGame(); };

document.getElementById("pause-btn").onclick = () => { gameRunning = false; cancelAnimationFrame(animationId); };
document.getElementById("restart-btn").onclick = () => location.reload();
document.getElementById("message-modal-close").onclick = () => location.reload();

document.addEventListener("keydown", e => {
  if (e.key === "ArrowUp") upPressed = true;
  if (e.key === "ArrowDown") downPressed = true;
  if (e.key === "w") wPressed = true;
  if (e.key === "s") sPressed = true;
});
document.addEventListener("keyup", e => {
  if (e.key === "ArrowUp") upPressed = false;
  if (e.key === "ArrowDown") downPressed = false;
  if (e.key === "w") wPressed = false;
  if (e.key === "s") sPressed = false;
});

function startGame() {
  document.getElementById("mode-select").style.display = "none";
  document.getElementById("pause-btn").disabled = false;
  gameRunning = true;
  if (gameMode === "timer") startTimer();
  loop();
}

function startTimer() {
  timerInterval = setInterval(() => {
    timer--;
    if (timer <= 0) {
      clearInterval(timerInterval);
      if (leftScore > rightScore) declareWinner(playerLeftName);
      else if (rightScore > leftScore) declareWinner(playerRightName);
      else suddenDeath = true;
    }
  }, 1000);
}

function loop() { update(); draw(); if (gameRunning) animationId = requestAnimationFrame(loop); }

function update() {
  let ps = reverseControl ? -8 : 8;
  if (wPressed && leftPaddleY > 0) leftPaddleY -= ps;
  if (sPressed && leftPaddleY + paddleHeight < 400) leftPaddleY += ps;
  if (upPressed && rightPaddleY > 0) rightPaddleY -= ps;
  if (downPressed && rightPaddleY + paddleHeight < 400) rightPaddleY += ps;

  ball.x += ball.dx; ball.y += ball.dy;
  if (ball.y - ball.radius < 0 || ball.y + ball.radius > 400) ball.dy *= -1;

  if (ball.x - ball.radius < 10 && ball.y > leftPaddleY && ball.y < leftPaddleY + paddleHeight) {
    ball.dx *= -1; triggerPowerUp();
  }
  if (ball.x + ball.radius > 690 && ball.y > rightPaddleY && ball.y < rightPaddleY + paddleHeight) {
    ball.dx *= -1; triggerPowerUp();
  }

  if (ball.x < 0) { rightScore++; resetBall(); }
  if (ball.x > 700) { leftScore++; resetBall(); }

  if (!suddenDeath) {
    if (leftScore >= 5) { declareWinner(playerLeftName); return; }
    if (rightScore >= 5) { declareWinner(playerRightName); return; }
  } else if (leftScore !== rightScore) {
    let winner = leftScore > rightScore ? playerLeftName : playerRightName;
    declareWinner(winner);
  }

  if (shakeTime > 0) shakeTime--;
}

function draw() {
  ctx.clearRect(0, 0, 700, 400);
  if (shakeTime > 0) ctx.save(), ctx.translate(Math.random()*5-2.5, Math.random()*5-2.5);

  ctx.setLineDash([5, 15]);
  ctx.beginPath(); ctx.moveTo(350, 0); ctx.lineTo(350, 400); ctx.strokeStyle="#4caf50"; ctx.stroke();

  ctx.fillStyle = powerUpActive ? "red" : "white";
  ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI*2); ctx.fill();

  ctx.fillStyle="white";
  ctx.fillRect(0, leftPaddleY, 10, paddleHeight);
  ctx.fillRect(690, rightPaddleY, 10, paddleHeight);

  ctx.font="16px Arial"; ctx.fillStyle="white";
  ctx.fillText(`L: ${leftScore}`, 20, 20);
  ctx.fillText(`R: ${rightScore}`, 650, 20);
  if (gameMode==="timer") ctx.fillStyle="yellow", ctx.fillText(`Time: ${timer}`, 320, 20);
  if (suddenDeath) ctx.fillStyle="red", ctx.fillText("Sudden Death!", 300, 50);

  if (shakeTime > 0) ctx.restore();
}

function resetBall() { ball = { x: 350, y: 200, dx: Math.sign(ball.dx)*5, dy: 3, radius: 10 }; }

function triggerPowerUp() {
  if (gameMode!=='powerup' || powerUpActive || Math.random()>0.3) return;
  powerUpActive = true;
  let effects = ['speed','shrink','reverse','bigball','shake'];
  let p = effects[Math.floor(Math.random()*effects.length)];
  let flash = document.createElement("div");
  flash.innerText="⚡ POWER UP!"; flash.className="power-flash"; document.body.appendChild(flash);

  if (p==='speed') ball.dx*=1.5, ball.dy*=1.5;
  if (p==='shrink') paddleHeight=40;
  if (p==='reverse') reverseControl=true;
  if (p==='bigball') ball.radius=20;
  if (p==='shake') shakeTime=30;

  setTimeout(()=>{
    paddleHeight=80; ball.radius=10; reverseControl=false; flash.remove(); powerUpActive=false;
  },3000);
}

function declareWinner(name) {
  showModal(`${name} Wins!`);
}

function showModal(msg) {
  gameRunning=false; cancelAnimationFrame(animationId); clearInterval(timerInterval);
  $("#message").html(`<strong>🎉 ${msg} 🎉</strong>`);
  $("#message-modal").modal("show");
}
