// select canvas element
const gameContainer = document.getElementById("gameContainer");

// getContext of canvas = methods and properties to draw and do a lot of thing to the canvas
const gameboard = document.querySelector("#canvas")
const ctx = gameboard.getContext('2d');
//select score element
const compScore = document.getElementById("computer-score")
const mainPlScore = document.getElementById("mainPlayer-score")
//select player elements
// const  mainPl = document.getElementById("main-player")
// const compOpp = document.getElementById("computer")
const resetBtn = document.querySelector("#resetBtn")

class Competitor {
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
const mainPl = new Competitor(0, 0, 25, 50, 0, "blue")


// Computer Paddle
const compOpp = new Competitor( gameboard.width - 25, gameboard.height - 50, 25, 50, 0, "red")


// Ball
const ball = {
    xAxis: gameboard.width / 2,
    yAxis: gameboard.height / 2,
    radius: 10,
    velocityX: 3,
    velocityY: 3,
    speed: 1,
    color: "#white"
}

const net = {
    x: (gameboard.width - 2) / 2,
    y: 0,
    height: 10,
    width: 4,
    color: "WHITE"
}
// Net
// const netObj = document.createElement("netObj")
// document.body.appendChild(netObj)


//event listener for reset and start button to do those functions when the btn is clicked
resetBtn.addEventListener("click", resetGame)
// startBtn.addEventListener("click", startGame)

// Function for drawing rectangles
function drawRect(xAxis, yAxis, width, height, color) {
    ctx.fillStyle = color;
    ctx.fillRect(xAxis, yAxis, width, height);
    ctx.strokeRect(xAxis, yAxis, width, height)
}

// draw circle, will be used to draw the ball
function drawCircle(xAxis, yAxis, radius, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    //for the arc you need x axis, y axis, radius, start angle, end angle, direction
    ctx.arc(xAxis, yAxis, radius, 0, 2 * Math.PI, true);
    ctx.closePath();
    ctx.fill();
}

// to listen for mouse
gameboard.addEventListener("mousemove", getMousePos);

function getMousePos(evt) {
    let rect = gameboard.getBoundingClientRect();

    mainPl.yAxis = evt.clientY - rect.top - mainPl.height / 2;
}
//getBoundingClientRect provides infoabout size of an element and its position relative to the  area in computer graphics that is currently being viewed
// resets the ball when  mainPl scores or compOpp scores
function resetBall() {
    ball.xAxis = gameboard.width / 2;
    ball.yAxis = gameboard.height / 2;
    ball.velocityX = -ball.velocityX;
    ball.speed = 1;
}



//draw the net
function drawNet() {
    for (let i = 0; i <= gameboard.height; i += 15) {
        drawRect(net.x, net.y + i, net.width, net.height, net.color);
    }
    ctx.fillsytle = "#FF0000";
}

//draw text is used to create text on canvas
function drawText(text, xAxis, yAxis) {
    ctx.fillStyle = "#FFF";
    ctx.font = "25px fantasy";
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
function resetGame() {
    rounds = 0;
    mainPlScore = 0;
    compScore = 0;
    ties = 0;
    round_number.innerHTML = 'Round: '
    ties_number.innerHTML = '0'
    computerScore_span.innerHTML = '0'
    userScore_span.innerHTML = '0'
}
// update function, the function that does all calculations
function update() {

    // change the score of players, if 
    if (ball.xAxis - ball.radius < 0) {
        compOpp.score++;
        resetBall();
    } else if (ball.xAxis + ball.radius > gameboard.width) {
        mainPl.score++;
        // mainPlScore.play();
        resetBall();
    }

    // the ball has a velocity - velocity controls speed and direection of ball
    ball.xAxis += ball.velocityX;
    ball.yAxis += ball.velocityY;


    // simple AI for computer - so that computer can play. The speee of computer will start at 0.1 and increase
    compOpp.yAxis += ((ball.yAxis - (compOpp.yAxis + compOpp.height / 2))) * 0.1;

    // if the ball collides with bottom and top walls the y velocity reverses.
    if (ball.yAxis - ball.radius < 0 || ball.yAxis + ball.radius > gameboard.height) {
        ball.velocityY = -ball.velocityY;
        // wall.play();
    }

    // ternary operator used to show whos turn it is when the ball is on the xAxis  
    let player = (ball.xAxis + ball.radius < gameboard.width / 2) ? mainPl : compOpp;

    // if statment for when the ball hits one of the paddles. Whether it be mainPl or comp
    if (collision(ball, player)) {
        // define the collidepoint which is where the ball hits the paddle
        let collidePoint = (ball.yAxis - (player.yAxis + player.height / 2));

        collidePoint = collidePoint / (player.height / 2);

        // need to get numbers between -1 and 1.

        // The ball needs to hit top and bottom of paddle at a -45 degree angle 
        //The ball will hit the center at 0 degree angle, will go straight across gameboard
        // Math.PI/4 = 45 degree (solve for)
        let angleRad = (Math.PI / 4) * collidePoint;

        // after collision happens, then change the velocity of the ball
        let direction = (ball.xAxis + ball.radius < gameboard.width / 2) ? 1 : -1;
        ball.velocityX = direction * ball.speed * Math.cos(angleRad);
        ball.velocityY = ball.speed * Math.sin(angleRad);

        // ball speed will increases with paddle hit
        ball.speed += 0.1;
    }
}
// var game = {
//     tickNumber: 0,
//     timer: null,
    
//     tick: function() {
//       game.tickNumber++;
//       graphics.drawGame();
//       game.timer = window.setTimeout("game.tick()", 500);
//     }
// }

// render function for canvas drawing
function render() {

    // clear the canvas
    drawRect(0, 0, gameboard.width, gameboard.height, "#000");

    // draw the user score to the left
    drawText(mainPl.score, gameboard.width / 4, gameboard.height / 5);

    // draw the computer score to the right
    drawText(compOpp.score, 3 * gameboard.width / 4, gameboard.height / 5);

    // draw the net
    drawNet();

    // draw the mainPl paddle
    drawRect(mainPl.xAxis, mainPl.yAxis, mainPl.width, mainPl.height, mainPl.color);

    // draw the compOpp paddle
    drawRect(compOpp.xAxis, compOpp.yAxis, compOpp.width, compOpp.height, compOpp.color);

    // draw the ball
    drawCircle(ball.xAxis, ball.yAxis, ball.radius, ball.color);
}
function gameStart() {

    update();
    render();
}
// number of frames per second
let framePerSecond = 50;

//call the game function 50 times every 1 Sec
let loop = setInterval(gameStart, 1000 / framePerSecond);





    
