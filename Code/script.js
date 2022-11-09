// select canvas element
const game = document.getElementById("gameContainer");

// getContext of canvas = methods and properties to draw and do a lot of thing to the canvas
const canvas = document.getElementByID("canvas")
const ctx = canvas.getContext('2d');
//select score element
const compScore = document.getElementById("computer-score")
const mainPlScore = document.getElementById("mainPlayer-score")
//select player elements
// const  mainPl = document.getElementById("main-player")
// const compOpp = document.getElementById("computer")
//calling game elements
const game = document.getElementById("gameContainer")


class Player {
    constructor(xAxis, yAxis, width, height, score, color) {
        this.xAxis = xAxis,
            this.yAxis + yAxis,
            this.width = width,
            this.height = height,
            this.score = score,
            this.color = color
    }
}


// create player1 paddle
const mainPl = new Player(0, 0, 25, 100, 0, "blue")


// Computer Paddle
const compOpp = new Player(25, 100, game.width - 25, (game.height - 100), 0, "red")

// Ball
const ball = {
    xAxis: game.width / 2,
    yAxis: game.height / 2,
    radius: 10,
    velocityX: 5,
    velocityY: 5,
    speed: 1,
    color: "#white"
}
// Net
const netObj = document.createElement("netObj")
document.body.appendChild(net)
// net.xAxis : (canvas.width - 2)/2,
// net.yAxis : 0

//event listener for reset and start button to do those functions when the btn is clicked
resetBtn.addEventListener("click", resetGame)
startBtn.addEventListener("click", startGame)

// Function for drawing rectangles
function drawRect(xAxis, yAxis, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(xAxis, yAxis, w, h);
    ctx.strokeRect()
}

drawRect(0, 0, .width, canvas.height, "#000");

// draw circle, will be used to draw the ball
function drawCircle(xAxis, yAxis, radius, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    //
    //for the arc you need x axis y axis radius 
    ctx.arc(xAxis, yAxis, radius, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.fill();
}

// to listen for mouse
canvas.addEventListener("mousemove", getMousePos);

function getMousePos(evt) {
    let rect = canvas.getBoundingClientRect();

    mainPl.yAxis = evt.clientY - rect.top - mainPl.height / 2;
}
//getBoundingClientRect providwa information about the size of an element and its position relative to the  area in computer graphics that is currently being viewed
// resets the ball when  mainPl scores or compOpp scores
function resetBall() {
    ball.xAxis = canvas.width / 2;
    ball.yAxis = canvas.height / 2;
    ball.velocityX = -ball.velocityX;
    ball.speed = 7;
}
//velocity controls speed of ball

// draw the net
// function drawNet(){
//     for(let i = 0; i <= canvas.height; i+=15){
//         drawRect(net.xAxis, net.yAxis + i, net.width, net.height, net.color);
//     }
// }

//draw text is used to create text on canvas
function drawText(text, xAxis, yAxis) {
    ctx.fillStyle = "#FFF";
    ctx.font = "45px fantasy";
    ctx.fillText(text, xAxis, yAxis);
}

// collision detection for when ball hits paddle(s)
function collision(b, p) {
    p.top = p.yAxis;
    p.bottom = p.yAxis + p.height;
    p.left = p.xAxis;
    p.right = p.xAxis + p.width;

    b.top = b.yAxis - b.radius;
    b.bottom = b.yAxis + b.radius;
    b.left = b.xAxis - b.radius;
    b.right = b.xAxis + b.radius;

    return p.left < b.right && p.top < b.bottom && p.right > b.left && p.bottom > b.top;
}

// update function, the function that does all calculations
function update() {

    // change the score of players, if 
    //for when the ball goes to the left "ball.xAxis<0" computer win, else if "ball.xAxis > canvas.width" the user win
    if (ball.xAxis - ball.radius < 0) {
        compOpp.score++;
        compScore.play();
        resetBall();
    } else if (ball.xAxis + ball.radius > canvas.width) {
        mainPl.score++;
        mainPlScore.play();
        resetBall();
    }

    // the ball has a velocity
    ball.xAxis += ball.velocityX;
    ball.yAxis += ball.velocityY;


    // simple AI for computer 
    compOpp.yAxis += ((ball.yAxis - (compOpp.yAxis + compOpp.height / 2))) * 0.1;

    // if the ball collides with bottom and top walls the y velocity reverses.
    if (ball.yAxis - ball.radius < 0 || ball.yAxis + ball.radius > game.height) {
        ball.velocityY = -ball.velocityY;
        wall.play();
    }

    // if the paddle hits the mainPl or the comp paddle. Use a ternary operator to show whos turn it is when the ball is on the xAxis 
    let player = (ball.xAxis + ball.radius < game.width / 2) ? mainPl : compOpp;

    // if statment for when the ball hits one of the paddles. Whether it be mainPl or comp
    if (collision(ball, player)) {
        // define the collidepoint which is where the ball hits the paddle
        let collidePoint = (ball.yAxis - (player.yAxis + player.height / 2));

        collidePoint = collidePoint / (player.height / 2);

        // normalize the value of collidePoint, we need to get numbers between -1 and 1.
        // -player.height/2 < collide Point < player.height/2

        // The ball needs to hit top and bottom of paddle at a -45degrees angle 
        //The ball will hit the center at a 0degrees angle, will go straight across gameboard
        // Math.PI/4 = 45degrees
        let angleRad = (Math.PI / 4) * collidePoint;

        // change the X and Y velocity direction
        let direction = (ball.xAxis + ball.radius < game.width / 2) ? 1 : -1;
        ball.velocityX = direction * ball.speed * Math.cos(angleRad);
        ball.velocityY = ball.speed * Math.sin(angleRad);

        // ball speed will increases with paddle hit
        ball.speed += 0.1;
    }
}

// render function for canvas drawing
function render() {

    // clear the canvas
    drawRect(0, 0, canvas.width, canvas.height, "#000");

    // draw the user score to the left
    drawText(mainPl.score, game.width / 4, game.height / 5);

    // draw the computer score to the right
    drawText(compOpp.score, 3 * game.width / 4, game.height / 5);

    // draw the net
    // drawNet();

    // draw the mainPl paddle
    drawRect(mainPl.xAxis, mainPl.yAxis, mainPl.width, mainPl.height, mainPl.color);

    // draw the compOpp paddle
    drawRect(compOpp.xAxis, compOpp.yAxis, compOpp.width, compOpp.height, compOpp.color);

    // draw the ball
    drawArc(ball.xAxis, ball.yAxis, ball.radius, ball.color);
}
function game() {

    update();
    render();
}
// number of frames per second
let framePerSecond = 50;

//call the game function 50 times every 1 Sec
let loop = setInterval(game, 1000 / framePerSecond);






