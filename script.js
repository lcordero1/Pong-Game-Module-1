const canvas = document.querySelector('canvas')
const ctx = canvas.getContext('2d')
const compScore = document.getElementById("computer-score")
const mainPlScore = document.getElementById("mainPlayer-score")

const mainPlayer = {
    x: 0,
    y: 100/2,
    width: 10,
    height: 100,
    color: "white",
    score: 0
}


const computerOpp = document.querySelector("computer")

const ball = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: 10,
    color: "white"
}

function drawRect(xAxis, yAxis, width, height, color) {
    ctx.fillStyle = color;
    ctx.fillRect(xAxis, yAxis, width, height);
}
drawRect(50, 100, 25, 50, "white")

function drawCircle() {
    ctx.fillStyle = "white"
    ctx.beginPath()
    // ctx.arc(x, y, radius, start angle (Math.PI*2), direction(not really important for circle))
    ctx.arc(0, 0, Math.PI * 2, false)
    ctx.closePath()
    ctx.fillShape()

}
function moveBallRand(ball) {
    ball.style.position = 'absolute';
    ball.style.top = Math.floor(Math.random() * 90 + 5) + '%';
    ball.style.left = Math.floor(Math.random() * 90 + 5) + '%';
}



// function collision()
// function framePerSecond()





