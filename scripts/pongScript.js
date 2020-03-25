const canvas = document.querySelector("#c");
const ctx = canvas.getContext("2d");
const f = new FontFace('pongFont', 'url(./font/bit5x3.woff)'); // fontti ja sen lataus, jotta saadaan kivat tekstit
f.load().then(function(font) { document.fonts.add(font);})
const trueFPS = 144; // Itelläni käytössä 144Hz näyttö, niin näyttää paremmalta. Muutenkin hirveä 30fps:nä
const gameFPS = trueFPS/30; 
const newRoundTimer = 1000;
const paddleStartWidth = 100;
const reduceSize = 8; // paljonko vähennetään mailan kokoa osumasta
var maxScore = 2;
var gameEnded = false;

var ptr = ">";
var ptrAnim;
var i = 0;

var menuShow = true;
var menuState = true; // true = cpu, false = player. helpompi hallita koodilla, kun ei ole kuin kaksi vaihtoehtoa.

var keyArrowLeft = false;
var keyArrowRight = false;
var keyArrowUp = false;
var keyArrowDown = false;
var keyEnter = false;
var keyP2Left = false;
var keyP2Right = false;

const speedYMax = 5;
const speedYMin = 2;
const speedXMax = 7;

var paddleTop = new Object();
paddleTop["Height"] = 10;
paddleTop["Width"] = paddleStartWidth;
paddleTop["x"] = canvas.width/2 - paddleTop.Width/2;
paddleTop["y"] = 10;
paddleTop["distToCenter"] = 0;
paddleTop["distToWidth"] = 0;
paddleTop["points"] = 0;

var paddleBottom = new Object();
paddleBottom["Height"] = 10;
paddleBottom["Width"] = paddleStartWidth;
paddleBottom["x"] = canvas.width/2-paddleBottom.Width/2;
paddleBottom["y"] = canvas.height-20;
paddleBottom["distToCenter"] = 0;
paddleBottom["distToWidth"] = 0;
paddleBottom["points"] = 0;

var ball = new Object();
ball["x"] = canvas.width/2;
ball["y"] = canvas.height/2;
ball["xSpeed"] = 1/gameFPS;        // Otettu pelinopeuden sitominen FPS:ään pois
ball["ySpeed"] = 3/gameFPS;
ball["radius"] = 10;

window.addEventListener("keydown", keyDownHandler, false);
window.addEventListener("keyup", keyUpHandler, false);

function keyDownHandler(e){
    if(e.keyCode == 39){
        keyArrowRight = true;
    }
    if(e.keyCode == 37){
        keyArrowLeft = true;
    }
    if(e.keyCode == 38){
        keyArrowUp = true;
    }
    if(e.keyCode == 40){
        keyArrowDown = true;
    }
    if(e.keyCode == 13){
        keyEnter = true;
    }
    if(e.keyCode == 65){
        keyP2Left = true;      // a-näppäin
    }
    if(e.keyCode == 68){
        keyP2Right = true;       // d-näppäin
    }
}
function keyUpHandler(e){
    if(e.keyCode == 39){
        keyArrowRight = false;
    }
    if(e.keyCode == 37){
        keyArrowLeft = false;
    }
    if(e.keyCode == 65){
        keyP2Left = false;      // a-näppäin
    }
    if(e.keyCode == 68){
        keyP2Right = false;       // d-näppäin
    }
}
function keyboardEvents(){
    // pelissä
    if(!menuShow){
        if(paddleBottom.distToCenter != 0 || paddleTop.distToCenter != 0){
            returnPaddle(paddleBottom);
            returnPaddle(paddleTop);
            if(Math.round(paddleBottom.x) == canvas.width/2 - paddleStartWidth/2 
                && Math.round(paddleBottom.Width) == paddleStartWidth){
                paddleBottom.distToCenter = 0;
            }
            if(Math.round(paddleTop.x) == canvas.width/2 - paddleStartWidth/2 
                && Math.round(paddleTop.Width) == paddleStartWidth){
                paddleTop.distToCenter = 0;
            }
        }else if(!gameEnded){
            if(keyArrowLeft){
                paddleBottom.x -=3/gameFPS;
            }
            if(keyArrowRight){
                paddleBottom.x +=3/gameFPS;
            }
            if(!menuState){
                if(keyP2Left){
                    paddleTop.x -=3/gameFPS;
                }
                if(keyP2Right){
                    paddleTop.x +=3/gameFPS;
                }
                outOfBoundsCheck(paddleTop);
            }
            outOfBoundsCheck(paddleBottom);
        } else if(gameEnded){
            console.log("game ended")
            if(keyEnter){
                console.log("Enter pressed");
                initGameObjects();
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                menuShow = true;
                keyEnter = false;
                gameEnded = false;
                paddleBottom.points = 0;
                paddleTop.points = 0;
            }
        }
    }
    // menussa
    else{
        if(keyArrowUp || keyArrowDown){
            menuState = !menuState;
            keyArrowUp = false;
            keyArrowDown = false;
        }
        if(keyEnter){
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            menuShow = false;
            keyEnter = false;
        }
    }
}
// pelialueen piirto
function drawBackground(){
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);    
}
// mailat
function drawPaddle(paddle){
    ctx.fillStyle = "white";
    ctx.fillRect(paddle.x, paddle.y, paddle.Width, paddle.Height);
}
// pallo
function drawBall(){
    ctx.strokeStyle = "black";
    ctx.fillStyle = "white";
    ctx.setLineDash([]);    // nollataan keskiviivan asetukset, jotta pallo muodostuu oikein
    ctx.lineWidth = 1;      // samoin tässä
    ctx.beginPath();
    ball.x += ball.xSpeed;
    ball.y += ball.ySpeed;
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI*2, true)
    ctx.fill();
    ctx.stroke();
}
function drawMiddleLine(){
    ctx.beginPath();
    ctx.setLineDash([10, 10]);
    ctx.lineWidth = 10;
    ctx.strokeStyle = "white";
    ctx.moveTo(5, canvas.height / 2 - 5);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
}
function drawScore(){
    var scale = (paddleTop.points<10) ? 40 : 80;
    drawText(100, paddleTop.points, canvas.width, canvas.height/2-20,scale,"right");
    scale = (paddleBottom.points<10) ? 40 : 80;
    drawText(100, paddleBottom.points, canvas.width, canvas.height/2+80,scale,"right");
}
function drawText(size, text, posx, posy, stretch, align){
    ctx.font = size + "px pongFont";
    ctx.fillStyle = "white";
    ctx.textAlign = align;
    ctx.fillText(text, posx, posy, stretch);

}
function drawStartScreen(){
    menuShow = true;
    drawText(100, "PONG", canvas.width/2, canvas.height/4, 1000, "center");
    drawText(50, "VS CPU", canvas.width/5, canvas.height/2, 1000, "left");
    drawText(50, "VS PLAYER", canvas.width/5, canvas.height*3/5, 1000, "left");
    drawText(50, ptr, canvas.width/5, menuState ? canvas.height/2 : canvas.height*3/5, 1000, "right");
}
function animPointer(){
    ptr = (ptr == ">") ? "-" : ">";
}

function initGameObjects(){
    ball.x = canvas.width/2;
    ball.y = canvas.height/2;
    ball.radius = 10;
    ball.ySpeed = 3/gameFPS;

    paddleTop.x = canvas.width/2 - paddleStartWidth/2;
    paddleTop.y = 10;
    paddleTop.Width = paddleStartWidth;
    paddleTop.Height = 10;
    //paddleTop.distToCenter = 0;
    
    paddleBottom.x = canvas.width/2-paddleStartWidth/2;
    paddleBottom.y = canvas.height-20
    paddleBottom.Width = paddleStartWidth;
    paddleBottom.Height = 10;
    //paddleBottom.distToCenter = 0;
}
function cpuAI(){
    if(ball.ySpeed < 0){
        if(ball.x < (paddleTop.x + paddleTop.Width/2)){
            paddleTop.x -= 2/gameFPS;
        }
        else{paddleTop.x += 2/gameFPS}
    }
    outOfBoundsCheck(paddleTop);
}
// Game loop
function pongGame(){
    drawBackground();
    // menu
    if(menuShow){
        drawStartScreen();
        if(ptrAnim == null){
            ptrAnim = setInterval(animPointer, 600);
            ptrRunOnce = true;
        }
    }
    // peli
    else{
        if(ptrAnim != null){
            initGameObjects();
            clearInterval(ptrAnim);
            ptrAnim = null;
        }
        drawScore();
        hitDetect();
        drawPaddle(paddleTop);
        drawPaddle(paddleBottom);
        drawMiddleLine();
        drawBall();
        if(menuState){
            cpuAI();
        }
        if(gameEnded){
            endGame();
        }
    }
    keyboardEvents();
}
// Pelin käynnistys.
window.setInterval(pongGame, 1000 / trueFPS);


function hitDetect(){
    if(ball.y + ball.radius >= paddleBottom.y){
        if(paddleBottom.x <= ball.x && ball.x <= paddleBottom.x + paddleBottom.Width){
            ball.y = paddleBottom.y - ball.radius;
            cornerHits(paddleBottom);
            if(paddleBottom.Width >= 10){
                paddleBottom.Width -= reduceSize;
                paddleBottom.x += reduceSize/2;
            }
            return;
        }
    }
    if(ball.y - ball.radius <= paddleTop.y + paddleTop.Height){
        if(paddleTop.x <= ball.x && ball.x <= paddleTop.x + paddleTop.Width){
            ball.y = paddleTop.y + ball.radius + paddleTop.Height;
            cornerHits(paddleTop);
            if(paddleTop.Width >= 10){
                paddleTop.Width -= reduceSize;
                paddleTop.x += reduceSize/2;
            }
            return;
        }
    }
    if(ball.x + ball.radius >= canvas.width || ball.x <= 0 + ball.radius){
        ball.xSpeed *= -1;
    }
    //tarkastetaan, ettei pallo liiku liian hitaasti tai nopeasti
    if(Math.abs(ball.ySpeed*gameFPS) > speedYMax){
        ball.ySpeed = Math.sign(ball.ySpeed)*speedYMax/gameFPS;
    }
    else if(Math.abs(ball.ySpeed*gameFPS) < speedYMin){
        ball.ySpeed = Math.sign(ball.ySpeed)*speedYMin/gameFPS;
    }
    if(Math.abs(ball.xSpeed*gameFPS) > speedXMax){
        ball.xSpeed = Math.sign(ball.xSpeed)*speedXMax/gameFPS;
    }
    // pisteet, jos pallo menee läpi
    if(ball.y <= 0){
        paddleBottom.points++;
        if(paddleBottom.points >= maxScore){
            gameEnded = true;
        }
        pointScored(false);
    }
    if(ball.y >= canvas.height){
        paddleTop.points++;
        if(paddleTop.points >= maxScore){
            gameEnded = true;
        }
        pointScored();
    }
}
function cornerHits(paddle){
    ball.ySpeed *= -1;
    // vauhti- ja suuntamuunnos
    // oikea puoli
    if(ball.x-paddle.x >= 0.6*paddle.Width){
        if(ball.x-paddle.x >= 0.8*paddle.Width){
            ball.xSpeed +=2/gameFPS;
            ball.ySpeed += Math.sign(ball.xSpeed)*1/gameFPS; // Kato vielä et toimii tasapuolisesti kummallekin palikoille!
        }else{
            ball.xSpeed +=1/gameFPS;
            ball.ySpeed += Math.sign(ball.xSpeed)*0.5/gameFPS;
        }
        if(ball.xSpeed < 0)
        ball.xSpeed *= -1;
    }
    // vasen puoli
    if(ball.x-paddle.x <= 0.4*paddle.Width){
        if(ball.x-paddle.x <= 0.2*paddle.Width){
            ball.xSpeed -= 2/gameFPS;
            ball.ySpeed += Math.sign(ball.xSpeed)*1/gameFPS;
        }else{
            ball.xSpeed -= 1/gameFPS;
            ball.ySpeed += Math.sign(ball.xSpeed)*0.5/gameFPS;
        }
        if(ball.xSpeed > 0)
        ball.xSpeed *= -1;
    }
}
function outOfBoundsCheck(paddle){
    if(paddle.x <= 0){
        paddle.x = 0;
    }
    if(paddle.x >= canvas.width - paddle.Width){
        paddle.x = canvas.width - paddle.Width
    }
}
function pointScored(){
    ball.ySpeed = 0;
    ball.y = canvas.height/2;
    ball.radius = 0;
    paddleBottom.distToCenter = paddleBottom.x - canvas.width/2 + paddleBottom.Width/2;
    paddleBottom.distToWidth = paddleStartWidth - paddleBottom.Width;
    paddleTop.distToCenter = paddleTop.x - canvas.width/2 + paddleTop.Width/2;
    paddleTop.distToWidth = paddleStartWidth - paddleTop.Width;
}
function returnPaddle(paddle){
    if(paddle.Width < paddleStartWidth){
        paddle.Width += paddle.distToWidth/(trueFPS*(newRoundTimer/1200));
    }
    if(Math.round(paddle.x) != canvas.width/2 - paddleStartWidth/2){
        paddle.x -= paddle.distToCenter/(trueFPS*(newRoundTimer/1000));
    } else if(Math.round(paddleBottom.x) == canvas.width/2 - paddleStartWidth/2 && 
                Math.round(paddleTop.x) == canvas.width/2 - paddleStartWidth/2 && !gameEnded){
        initGameObjects();
    }
}
function endGame(){
    if(paddleBottom.points >= maxScore){
        drawText(100, "PLAYER 1", canvas.width/2, 120, 300, "center");
    } else if(paddleTop.points >= maxScore){
        if(menuState){
            drawText(100, "CPU", canvas.width/2, 120, 300, "center");
        } else{
            drawText(100, "PLAYER 2", canvas.width/2, 120, 300, "center");
        }
    }
    drawText(100, "WINS!", canvas.width/2, 200, 300, "center");
    drawText(60, "PRESS ENTER", canvas.width/2, 320, 220, "center");
    drawText(60, "TO CONTINUE", canvas.width/2, 370, 220, "center");
}