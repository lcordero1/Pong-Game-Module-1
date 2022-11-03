const canvas =  document.querySelector('canvas')
const context = document.querySelector('2d')
const compScore = document.getElementById("computer-score")
const mainPlScore = document.getElementById("mainPlayer-score")

function drawRect(color, x, y, w, h) {
    ctx1.fillStyle = "white"; //color
//  ctx.fillRect(x, y, width, height)
    ctx.fillRect(50, 50 , 25, 100);
}
function drawCircle() {
    ctx.fillStyle = "white"
    ctx.beginPath()
// ctx.arc(x, y, radius, start angle (Math.PI*2), direction(not really important for circle))
    ctx.arc(50, 50, Math.PI*2, false )
    ctx.closePath()
    ctx.fillShape()

}
function collisionDetection()
function framePerSecond()

const mainPlayer = document.querySelector("main-player") 


const computerOpp = document.querySelector("computer")



const ball = {

}