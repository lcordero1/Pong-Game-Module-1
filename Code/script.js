// select canvas element
const canvas = document.getElementById("canvas");

// getContext of canvas = methods and properties to draw and do a lot of thing to the canvas
const ctx = canvas.getContext('2d');
//select score element
const compScore = document.getElementById("computer-score")
const mainPlScore = document.getElementById("mainPlayer-score")
//select player elements
// const  mainPl = document.getElementById("main-player")
// const compOpp = document.getElementById("computer")

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
const mainPl = new Player (0, (canvas.height - 100)/2, 0, "white")


// Computer Paddle
const compOpp = new Player (canvas.width - 10, (canvas.height - 100)/2, 10, 100, 0,"white")
//width and height of paddle
// Ball
const ball = {
    xAxis : canvas.width/2,
    yAxis : canvas.height/2,
    radius : 10,
    velocityX : 5,
    velocityY : 5,
    speed : 7,
    color : "#white"
}
// Net
const net = document.getElementById("net") {
    xAxis : (canvas.width - 2)/2,
    yAxis : 0,
    height : 10,
    width : 2,
    color : "#white"
}

// Function for drawing rectangles

function drawRect(xAxis, yAxis, w, h, color){
    ctx.fillStyle = color;
    ctx.fillRect(xAxis, yAxis, w, h);
}

// draw circle, will be used to draw the ball
function drawCircle(xAxis, yAxis, r, color){
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(xAxis,yAxis,r,0,Math.PI*2,true);
    ctx.closePath();
    ctx.fill();
}

// listening to the mouse
canvas.addEventListener("mousemove", getMousePos);

 function getMousePos(evt){
     let rect = canvas.getBoundingClientRect();
    
   mainPl.yAxis = evt.clientY - rect.top - user.height/2;
}
//getBoundingClientRect providing information about the size of an element and its position relative to the  area in computer graphics that is currently being viewed
// resets the ball when  mainPl scores or compOpp scores
function resetBall(){
    ball.xAxis = canvas.width/2;
    ball.yAxis = canvas.height/2;
    ball.velocityX = -ball.velocityX;
    ball.speed = 7;
}
//velocity controls speed of ball

// draw the net
function drawNet(){
    for(let i = 0; i <= canvas.height; i+=15){
        drawRect(net.xAxis, net.yAxis + i, net.width, net.height, net.color);
    }
}

//draw text is used to create text on canvas
function drawText(text,xAxis,yAxis){
    ctx.fillStyle = "#FFF";
    ctx.font = "45px fantasy";
    ctx.fillText(text, xAxis, yAxis);
}

// collision detection for when ball hits paddle(s)
function collision(b,p){
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
function update(){
    
    // change the score of players, if the ball goes to the left "ball.xAxis<0" computer win, else if "ball.xAxis > canvas.width" the user win
    if( ball.xAxis - ball.radius < 0 ){
        compOpp.score++;
        compScore.play();
        resetBall();
    } else if( ball.xAxis + ball.radius > canvas.width){
        mainPl.score++;
        mainPlScore.play();
        resetBall();
    }
    
    // the ball has a velocity
    ball.xAxis += ball.velocityX;
    ball.yAxis += ball.velocityY;
    
    
    // simple AI for computer 
    compOpp.yAxis += ((ball.yAxis - (compOpp.yAxis + compOpp.height/2)))*0.1;
    
    // if the ball collides with bottom and top walls the y velocity reverses.
    if(ball.yAxis - ball.radius < 0 || ball.yAxis + ball.radius > canvas.height){
        ball.velocityY = -ball.velocityY;
        wall.play();
    }
    
    // if the paddle hit the mainPl or the comp paddle
    let player = (ball.xAxis + ball.radius < canvas.width/2) ? mainPl : compOpp;
    
    // if the ball hits a paddle
    if(collision(ball,player)){
        //where the ball hits the paddle
        let collidePoint = (ball.yAxis - (player.yAxis + player.height/2));
        // normalize the value of collidePoint, we need to get numbers between -1 and 1.
        // -player.height/2 < collide Point < player.height/2
        collidePoint = collidePoint / (player.height/2);
        
        // The ball needs to hit the top of the paddle at a -45degrees angle 
        //The ball will hit the center at a 0degrees angle
        // when the ball hits the bottom of the paddle we want the ball to take a 45degrees
        // Math.PI/4 = 45degrees
        let angleRadius = (Math.PI/4) * collidePoint;
        
        // change the X and Y velocity direction
        let direction = (ball.x + ball.radius < canvas.width/2) ? 1 : -1;
        ball.velocityX = direction * ball.speed * Math.cos(angleRad);
        ball.velocityY = ball.speed * Math.sin(angleRad);
        
        // ball speed when paddle hits it.
        ball.speed += 0.1;
    }
}

// render function for canvas drawing
function render(){
    
    // clear the canvas
    drawRect(0, 0, canvas.width, canvas.height, "#000");
    
    // draw the user score to the left
    drawText(user.score,canvas.width/4,canvas.height/5);
    
    // draw the COM score to the right
    drawText(compOpp.score,3*canvas.width/4,canvas.height/5);
    
    // draw the net
    drawNet();
    
    // draw the mainPl paddle
    drawRect(mainPl.xAxis, mainPl.yAxis, mainPl.width, mainPl.height, mainPl.color);
    
    // draw the compOpp paddle
    drawRect(compOpp.xAxis, compOpp.yAxis, compOpp.width, compOpp.height, compOpp.color);
    
    // draw the ball
    drawArc(ball.xAxis, ball.yAxis, ball.radius, ball.color);
}
function game(){

    update();
    render();
}
// number of frames per second
let framePerSecond = 50;

//call the game function 50 times every 1 Sec
let loop = setInterval(game,1000/framePerSecond);






