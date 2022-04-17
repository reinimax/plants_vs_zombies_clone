const canvas = document.querySelector('#canvas');
canvas.width = 600;
canvas.height = 400;
const ctx = canvas.getContext('2d');

const cellSize = 50;
let mouseX = undefined;
let mouseY = undefined;
const cells = [];
const projectiles = [];
const numOfRows = 7;
let enemies = [];
let ressources = 300;
// health of the base. If it falls below 0 the game is lost
let baseHealth = 500;

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
  }

  draw() {
    if (this.isMoving) {
      this.x -= this.speed;
    }

    ctx.fillStyle = '#F00';
    ctx.fillRect(this.x, this.y, cellSize, cellSize);
    // draw health info
    ctx.fillStyle = '#000';
    ctx.font = '16px Arial';
    ctx.fillText(this.health, this.x + 10, this.y + 30);
  }
}

function generateEnemies() {
  // we add cellsize to account for the uppermost part of the
  // canvas that is not part of the gamebord
  let randomRow = Math.floor(Math.random() * numOfRows) * cellSize + cellSize;
  if (frames % 150 === 0) {
    enemies.push(new Enemy(randomRow));
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
      // TODO grant victory points
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

class Projectile {
  constructor(x, y, damage) {
    this.damage = damage;
    this.x = x;
    this.y = y;
    this.width = 20;
    this.height = 20;
    this.row = y / cellSize;
    this.speed = 0.5;
  }

  draw() {
    this.x += this.speed;
    ctx.fillStyle = '#FF0';
    ctx.fillRect(
      this.x + this.width / 2,
      this.y + this.height / 2,
      this.width,
      this.height
    );
  }
}

class Defender {
  static cost = 100;

  constructor(x, y, width, height) {
    this.health = 100;
    this.damage = 20;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.row = y / cellSize;
  }

  draw() {
    ctx.fillStyle = '#00F';
    ctx.fillRect(this.x, this.y, this.width, this.height);
    // draw health info
    ctx.fillStyle = '#000';
    ctx.font = '16px Arial';
    ctx.fillText(this.health, this.x + 10, this.y + 30);
  }

  shoot() {
    if (detectEnemiesOnRow(this.row)) {
      projectiles.push(new Projectile(this.x, this.y, this.damage));
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

function drawGrid() {
  ctx.strokeStyle = '#000';
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
        ctx.strokeStyle = '#0F0';
        ctx.beginPath();
        ctx.rect(x, y, cellSize, cellSize);
        ctx.stroke();
        ctx.strokeStyle = '#000';
      }
      // we can use this later if we want to toggle grid on/off
      else {
        ctx.beginPath();
        ctx.rect(x, y, cellSize, cellSize);
        ctx.stroke();
      }
    }
  }
}

function drawDefenders() {
  let cellsWithDefenders = cells.filter(cell => cell.defender !== null);
  cellsWithDefenders.forEach(cell => {
    // if defender health is 0 or below, remove him
    if (cell.defender.health <= 0) {
      cell.defender = null;
      return;
    }
    cell.defender.draw();
    if (frames % 150 == 0) cell.defender.shoot();
  });
}

function handleProjectiles() {
  for (let i = 0; i < projectiles.length; i++) {
    projectiles[i].draw();

    // if the projectile goes off screen, remove it
    if (projectiles[i].x > canvas.width) {
      projectiles.splice(i, 1);
      i--;
      continue;
    }

    // we use every here, because we cannot break out of forEach once we found a collision
    enemies.every(enemy => {
      if (
        projectiles[i].x + projectiles[i].width >= enemy.x &&
        projectiles[i].row === enemy.row
      ) {
        enemy.health -= projectiles[i].damage;
        projectiles.splice(i, 1);
        i--;
        // return false to break out of every
        return false;
      }
      // return true to keep the loop going
      return true;
    });
  }
}

function placeDefender(e) {
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
    activeCell.height
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
  ctx.fillStyle = '#000';
  ctx.font = '20px Arial';
  ctx.fillText('Ressources: ' + ressources, 10, 30);

  ctx.font = '20px Arial';
  ctx.fillText('Health of base: ' + baseHealth, 200, 30);
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

let frames = 0;

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawGameInfo();
  drawGrid();
  drawDefenders();
  handleProjectiles();

  generateEnemies();
  handleEnemies();
  handleCollisions();
  drawEnemies();

  frames++;

  requestAnimationFrame(gameLoop);
}

gameLoop();
// create the cells once.
createCells();

document.addEventListener('mousemove', highlightMouseCell);
document.addEventListener('click', placeDefender);
