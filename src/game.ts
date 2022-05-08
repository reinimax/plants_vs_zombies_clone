import enemy1SpriteSheet from './assets/sprites/enemy1.png';
import Defender from './lib/Model/Defender';

import ServiceContainer from './lib/Core/ServiceContainer';
import CanvasManager from './lib/Services/CanvasManager';

const container = new ServiceContainer();

const canvas = document.querySelector('#canvas');
canvas.width = 600;
canvas.height = 400;
//const ctx = canvas.getContext('2d');

container.set('canvasManager', CanvasManager, canvas);

const canvasManager = container.get('canvasManager');

const cellSize = 50;
let mouseX = undefined;
let mouseY = undefined;
let cells = [];
//let projectiles = [];
const numOfRows = 7;
let enemies = [];
let ressources = 300;
// health of the base. If it falls below 0 the game is lost
let baseHealth = 500;
// victory points are awarded when an enemy is killed. If enough are reached, the player wins
let victoryPoints = 0;
let gameIsRunning = false;

class Enemy {
  constructor(y) {
    this.health = 100;
    this.worth = 50;
    this.damage = 20;
    this.y = y;
    this.x = canvas.width;
    this.width = cellSize;
    this.height = cellSize;
    this.speed = 0.5;
    this.isMoving = true;
    this.row = y / cellSize;
    this.victoryPoints = 5;
    this.spriteSheet = new Image();
    this.spriteSheet.src = enemy1SpriteSheet;
    this.frameX = 0;
    this.frameY = 25; // set start frame to the first frame of the walking animation
    this.frameWidth = 258;
    this.frameHeight = 258;
    // first 15 animations have different height - account for that
    this.frameOffset = 2910;

    // "metadata" about the spritesheet. Since it will be different for every spritesheet, we have to connect it somehow
    // to a specific spritesheet. Maybe save it a json and load it together with the corresponding spritesheet?
    this.spriteSheetInfo = {
      width: 258,
      height: 6780,
      animationSets: {
        move: {
          numOfSprites: 5,
          currentSprite: 99, // set a number greater the numOfSprites so that on the first run, we reset it to 0
          startX: 0,
          startY: 5490,
          sizeX: 258,
          sizeY: 258
        }
      }
    };

    this.animation = null;
  }

  draw() {
    this.animation = this.spriteSheetInfo.animationSets.move;
    // debounce animation
    if (frames % 10 === 0) {
      // walking animation starts at sprite 25 and ends at sprite 29
      if (this.frameY >= 29) {
        this.frameY = 25;
      } else {
        this.frameY++;
      }
      // new try with animation variable
      // we increment the sprite first and the check if it exceeds the limit. Keep in mind, it is 5 sprites here, but we
      // start at 0! So we actually have indices 0-4. If the index reaches 5, we must reset it to 0.
      // Another option is to keep the if-else structure, but then we need to move this code below the drawImage function!
      // Otherwise this happens: we come in with index 4, which still triggers the else part of the statement. So we increment
      // it to 5 and draw index 5 which is actually too big.
      // We could also subtract -1 from numOfSprites in the if-statement to account for starting at 0. maybe this would be
      // most reasonable.
      this.animation.currentSprite++;
      if (this.animation.currentSprite >= this.animation.numOfSprites) {
        this.animation.currentSprite = 0;
      } else {
        //this.animation.currentSprite++;
      }
      //console.log(this.animation.currentSprite);
    }

    if (this.isMoving) {
      this.x -= this.speed;
    }

    canvasManager.ctx.drawImage(
      this.spriteSheet,
      this.animation.startX,
      this.animation.startY +
        this.animation.currentSprite * this.animation.sizeY,
      this.animation.sizeX,
      this.animation.sizeY,
      this.x,
      this.y,
      this.width,
      this.height
    );
    // draw health info
    canvasManager.drawText(this.health.toString(), this.x + 10, this.y + 20, {
      fillStyle: '#000',
      font: '16px Arial'
    });
  }
}

let once = false; // we used once variable to spawn only one enemy to debug animation
function generateEnemies() {
  // we add cellsize to account for the uppermost part of the
  // canvas that is not part of the gamebord
  let randomRow = Math.floor(Math.random() * numOfRows) * cellSize + cellSize;
  if (frames % 150 === 0 && once === false) {
    enemies.push(new Enemy(randomRow));
    //once = true;
  }
}

function drawEnemies() {
  enemies.forEach(enemy => {
    enemy.draw();
  });
}

function handleEnemies() {
  // if an enemy leaves the board, damage the base and
  // remove him from the enemies array
  for (let i = 0; i < enemies.length; i++) {
    enemies[i].isMoving = true;
    // remove dead enemies and grant ressources
    if (enemies[i].health <= 0) {
      ressources += enemies[i].worth;
      victoryPoints += enemies[i].victoryPoints;
      enemies.splice(i, 1);
      i--;
      continue;
    }

    if (enemies[i].x < 0 - cellSize) {
      // damage the base
      baseHealth -= enemies[i].damage;
      // remove enemy from the array
      enemies.splice(i, 1);
      // decrement i because array gets shorter
      // in practice this should be nigh irrelevant because though
      // it prevents "jumping" over the next array element, both
      // elements would need to be outside the gameboard on the
      // exact same frame
      i--;
    }
  }
}

class Cell {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = cellSize;
    this.height = cellSize;
    this.defender = null;
    this.row = y / cellSize;
  }

  isHoverdOver(x, y) {
    return (
      this.x < x &&
      this.x + this.width > x &&
      this.y < y &&
      this.y + this.height > y
    );
  }
}

// create the cell objects
function createCells() {
  for (let x = 0; x < canvas.width; x += cellSize) {
    for (let y = cellSize; y < canvas.height; y += cellSize) {
      let cell = new Cell(x, y);
      cells.push(cell);
    }
  }
}

// TODO: naming of the function is not good. It actually defines mouse position, not highlighting it!
function highlightMouseCell(e) {
  // only perform this action every 2 frames (primitive debounce).
  if (frames % 2 === 0) {
    // console.log(e);
    // console.log(canvas);

    // if the mouse is not inside the canvas, return
    if (
      e.clientX - canvas.offsetLeft < 0 || // left
      e.clientX - canvas.offsetLeft > canvas.width || // right
      e.clientY - canvas.offsetTop < 0 || // top
      e.clientY - canvas.offsetTop > canvas.height // bottom
    ) {
      mouseX = undefined;
      mouseY = undefined;
      return;
    }
    mouseX = e.clientX - canvas.offsetLeft;
    mouseY = e.clientY - canvas.offsetTop;

    // console.log('mouseX: ' + mouseX);
    // console.log('mouseY: ' + mouseY);
  }
}

// TODO: we can simply loop over the cells array - no need for nested for-loop!
function drawGrid() {
  canvasManager.ctx.strokeStyle = '#000';
  for (let x = 0; x < canvas.width; x += cellSize) {
    for (let y = cellSize; y < canvas.height; y += cellSize) {
      // highlight the cell with the cursor
      if (
        mouseX &&
        mouseX > x &&
        mouseX < x + cellSize &&
        mouseY &&
        mouseY > y &&
        mouseY < y + cellSize
      ) {
        canvasManager.ctx.strokeStyle = '#0F0';
        canvasManager.ctx.beginPath();
        canvasManager.ctx.rect(x, y, cellSize, cellSize);
        canvasManager.ctx.stroke();
        canvasManager.ctx.strokeStyle = '#000';
      }
      // we can use this later if we want to toggle grid on/off
      else {
        canvasManager.ctx.beginPath();
        canvasManager.ctx.rect(x, y, cellSize, cellSize);
        canvasManager.ctx.stroke();
      }
    }
  }
}

// actually, we could check when the cells are drawn if the cell has a defender and then handle him.
function drawDefenders() {
  let cellsWithDefenders = cells.filter(cell => cell.defender !== null);
  cellsWithDefenders.forEach(cell => {
    // if defender health is 0 or below, remove him
    if (cell.defender.health <= 0) {
      cell.defender = null;
      return;
    }
    cell.defender.draw();
    if (detectEnemiesOnRow(cell.defender.row) && frames % 150 == 0)
      cell.defender.shoot();
  });
}

function handleProjectiles() {
  const defenders = getDefendersArray();
  defenders.forEach(defender => {
    for (let i = 0; i < defender.projectiles.length; i++) {
      defender.projectiles[i].draw();

      // if the projectile goes off screen, remove it
      if (defender.projectiles[i].x > canvas.width) {
        defender.projectiles.splice(i, 1);
        i--;
        continue;
      }

      // we use every here, because we cannot break out of forEach once we found a collision
      enemies.every(enemy => {
        if (
          defender.projectiles[i].x + defender.projectiles[i].width >=
            enemy.x &&
          defender.projectiles[i].row === enemy.row
        ) {
          enemy.health -= defender.projectiles[i].damage;
          defender.projectiles.splice(i, 1);
          i--;
          // return false to break out of every
          return false;
        }
        // return true to keep the loop going
        return true;
      });
    }
  });
}

function placeDefender(e) {
  if (!gameIsRunning) {
    return;
  }

  let activeCellArr = cells.filter(cell => cell.isHoverdOver(mouseX, mouseY));
  if (activeCellArr.length !== 1) return;

  let activeCell = activeCellArr[0];

  if (activeCell.defender) {
    console.log('there is already a defender on this tile');
    return;
  }

  // check if we can afford the defender
  if (ressources - Defender.cost < 0) {
    console.log('not enough ressources');
    return;
  }

  // make sure that there is no enemy on the tile
  let enemyAtTheGates = enemies.filter(enemy => {
    return detectRowBasedCollision(activeCell, enemy);
  });
  if (enemyAtTheGates.length > 0) {
    console.log('you cannot place defenders on tiles with enemies!');
    return;
  }

  activeCell.defender = new Defender(
    activeCell.x,
    activeCell.y,
    activeCell.width,
    activeCell.height,
    cellSize,
    canvasManager
  );
  ressources -= Defender.cost;

  console.log(activeCell);
}

/** Helper that returns an array of defender objects. */
function getDefendersArray() {
  return cells.reduce(function(defendersArr, cell) {
    if (cell.defender !== null) {
      defendersArr.push(cell.defender);
    }
    return defendersArr;
  }, []);
}

/** Helper that detects if there are enemies on the defender's row */
function detectEnemiesOnRow(row) {
  return enemies.some(enemy => enemy.row === row);
}

// this function draws all the info about game state
function drawGameInfo() {
  //ctx.fillStyle = '#000';
  //ctx.font = '20px Arial';
  canvasManager.drawText('Ressources: ' + ressources, 10, 30);
  canvasManager.drawText('Health of base: ' + baseHealth, 200, 30);
  canvasManager.drawText('Victory Points: ' + victoryPoints, 420, 30);
}

// handle collision detection between defenders and enemies
function detectRowBasedCollision(defender, enemy) {
  return (
    defender.x + defender.width >= enemy.x &&
    // without this condition, it would not be able to place
    // defenders to the right of enemies
    defender.x < enemy.x + enemy.width &&
    defender.row === enemy.row
  );
}

function handleCollisions() {
  let defenders = getDefendersArray();

  if (defenders.length >= 1) {
    defenders.forEach(defender => {
      enemies.forEach(enemy => {
        if (detectRowBasedCollision(defender, enemy)) {
          // stop the enemy from moving
          enemy.isMoving = false;
          // reduce the health of the defender
          // (debounce it a bit because it is very fast)
          if (frames % 5 === 0) defender.health -= 1;
          // if the defender is dead, start moving again.
          // defenders are removed in drawDefenders function
          if (defender.health <= 0) enemy.isMoving = true;
        }
      });
    });
  } else {
    // if there are no defenders, make sure all enemies are moving
    enemies.forEach(enemy => (enemy.isMoving = true));
  }
}

function restartGame(e) {
  // check if we clicked on the button
  if (
    !gameIsRunning &&
    e.clientX >= canvas.width / 2 - 60 &&
    e.clientX <= canvas.width / 2 + 60 &&
    e.clientY >= canvas.height / 2 + 80 &&
    e.clientY <= canvas.height / 2 + 120
  ) {
    gameIsRunning = true;
    // reset the ctx text properties to their default
    //ctx.textBaseline = 'alphabetic';
    //ctx.textAlign = 'start';
    // reset game variables
    frames = 0;
    enemies = [];
    ressources = 300;
    baseHealth = 500;
    victoryPoints = 0;
    cells = [];
    //projectiles = [];
    gameLoop();
    createCells();
  }
}

let frames = 0;

function gameLoop() {
  // check if game is won or lost
  if (baseHealth <= 0) {
    gameIsRunning = false;
    canvasManager.drawFilledRect(0, 0, 600, 400, {
      fillStyle: 'rgba(0,0,0,.5)'
    });
    const options = {
      fillStyle: '#FFF',
      font: '30px Arial',
      textBaseline: 'middle',
      textAlign: 'center'
    };

    canvasManager.drawText(
      'The enemies destroyed the base.',
      canvas.width / 2,
      canvas.height / 2 + 20,
      options
    );

    canvasManager.drawText(
      'The game is lost!',
      canvas.width / 2,
      canvas.height / 2 - 20,
      options
    );
    // draw restart button
    canvasManager.drawFilledRect(
      canvas.width / 2 - 60,
      canvas.height / 2 + 80,
      120,
      40,
      { fillStyle: '#FFF' }
    );
    canvasManager.drawText(
      'PLAY AGAIN',
      canvas.width / 2,
      canvas.height / 2 + 100,
      {
        textBaseline: 'middle',
        textAlign: 'center'
      }
    );
    return;
  } else if (victoryPoints >= 100) {
    gameIsRunning = false;
    canvasManager.drawFilledRect(0, 0, 600, 400, {
      fillStyle: 'rgba(0,0,0,.5)'
    });
    const options = {
      fillStyle: '#FFF',
      font: '30px Arial',
      textBaseline: 'middle',
      textAlign: 'center'
    };

    canvasManager.drawText(
      'The enemy forces suffered heavy losses',
      canvas.width / 2,
      canvas.height / 2 - 40,
      options
    );
    canvasManager.drawText(
      'and are retreating.',
      canvas.width / 2,
      canvas.height / 2,
      options
    );
    canvasManager.drawText(
      'You are victorious!',
      canvas.width / 2,
      canvas.height / 2 + 40,
      options
    );
    // draw restart button
    canvasManager.drawFilledRect(
      canvas.width / 2 - 60,
      canvas.height / 2 + 80,
      120,
      40,
      { fillStyle: '#FFF' }
    );
    canvasManager.drawText(
      'PLAY AGAIN',
      canvas.width / 2,
      canvas.height / 2 + 100,
      {
        textBaseline: 'middle',
        textAlign: 'center'
      }
    );
    return;
  }

  canvasManager.ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawGrid();
  drawDefenders();
  handleProjectiles();

  generateEnemies();
  handleEnemies();
  handleCollisions();
  drawEnemies();
  drawGameInfo();

  frames++;

  requestAnimationFrame(gameLoop);
}

// draw the start screen
canvasManager.drawFilledRect(0, 0, 600, 400, { fillStyle: 'rgba(0,0,0,.5)' });
const options = {
  fillStyle: '#FFF',
  font: '30px Arial',
  textBaseline: 'middle',
  textAlign: 'center'
};

canvasManager.drawText(
  'Enemies are attacking our base!',
  canvas.width / 2,
  canvas.height / 2 - 40,
  options
);
canvasManager.drawText(
  'Place defenders with the mouse to defend the base.',
  canvas.width / 2,
  canvas.height / 2,
  { textBaseline: 'middle', textAlign: 'center', fillStyle: '#FFF' }
);
// draw restart button
canvasManager.drawFilledRect(
  canvas.width / 2 - 60,
  canvas.height / 2 + 80,
  120,
  40,
  { fillStyle: '#FFF' }
);
canvasManager.drawText('START', canvas.width / 2, canvas.height / 2 + 100, {
  textBaseline: 'middle',
  textAlign: 'center'
});

document.addEventListener('mousemove', highlightMouseCell);
document.addEventListener('click', placeDefender);
document.addEventListener('click', restartGame);
