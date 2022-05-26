import Defender from './lib/Model/Defender';

import ServiceContainer from './lib/Core/ServiceContainer';
import CanvasManager from './lib/Services/CanvasManager';
import GameManager from './lib/Services/GameManager';
import EnemyManager from './lib/Services/EnemyManager';
import Grid from './lib/Services/Grid';
import Input from './lib/Services/Input';

const container = new ServiceContainer();

const canvas = document.querySelector('#canvas');

// set container instances and create service classes
container.set('canvasManager', CanvasManager, canvas);
container.set('gameManager', GameManager);
const canvasManager = container.get('canvasManager');
const gameManager = container.get('gameManager');

container.set('enemyManager', EnemyManager, gameManager, canvasManager);
container.set('input', Input, gameManager, canvas);
const enemyManager = container.get('enemyManager');
const input = container.get('input');

container.set('grid', Grid, canvasManager, input, gameManager.cellSize);
const grid = container.get('grid');

// todo add a gameState object for all the globals?

// manager for
// - enemies
// - defenders (+ projectiles)
// each manager holds the array of objects and has a get method
// or just one single instance of object manager?

// consider the use of finite state machine
// - game has essentially four states: won, lost, running, start_screen
// - enemies and defenders also have states: alive, shooting/attacking, walking, dead/dying

// how can I break this stuff apart?
// I can break out the user input (note: user input will interact only with cells/defenders for now. later maybe ui and other stuff on a cell)
// the more I think about it, it makes sense to somewhere manage the cells directly
// I can break out the drawing stuff

// maybe from an architecural standpoint it doe snot make much sense to separate defenders and enemies - but it would give a better overview

// actually, we could check when the cells are drawn if the cell has a defender and then handle him.
function drawDefenders() {
  let cellsWithDefenders = grid.cells.filter(cell => cell.defender !== null);
  cellsWithDefenders.forEach(cell => {
    // if defender health is 0 or below, remove him
    if (cell.defender.health <= 0) {
      cell.defender = null;
      return;
    }
    cell.defender.draw();
    if (detectEnemiesOnRow(cell.defender.row) && gameManager.frames % 150 == 0)
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
      enemyManager.enemies.every(enemy => {
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
  if (!gameManager.gameIsRunning) {
    return;
  }

  let activeCellArr = grid.cells.filter(cell =>
    cell.isHoverdOver(input.mouseX, input.mouseY)
  );
  if (activeCellArr.length !== 1) return;

  let activeCell = activeCellArr[0];

  if (activeCell.defender) {
    console.log('there is already a defender on this tile');
    return;
  }

  // check if we can afford the defender
  if (gameManager.ressources - Defender.cost < 0) {
    console.log('not enough ressources');
    return;
  }

  // make sure that there is no enemy on the tile
  let enemyAtTheGates = enemyManager.enemies.filter(enemy => {
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
    gameManager.cellSize,
    canvasManager
  );
  gameManager.ressources -= Defender.cost;

  console.log(activeCell);
}

/** Helper that returns an array of defender objects. */
function getDefendersArray() {
  return grid.cells.reduce(function(defendersArr, cell) {
    if (cell.defender !== null) {
      defendersArr.push(cell.defender);
    }
    return defendersArr;
  }, []);
}

/** Helper that detects if there are enemies on the defender's row */
function detectEnemiesOnRow(row) {
  return enemyManager.enemies.some(enemy => enemy.row === row);
}

// this function draws all the info about game state
function drawGameInfo() {
  canvasManager.drawText('Ressources: ' + gameManager.ressources, 10, 30);
  canvasManager.drawText('Health of base: ' + gameManager.baseHealth, 200, 30);
  canvasManager.drawText(
    'Victory Points: ' + gameManager.victoryPoints,
    420,
    30
  );
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
      enemyManager.enemies.forEach(enemy => {
        if (detectRowBasedCollision(defender, enemy)) {
          // stop the enemy from moving
          enemy.isMoving = false;
          // reduce the health of the defender
          // (debounce it a bit because it is very fast)
          if (gameManager.frames % 5 === 0) defender.health -= 1;
          // if the defender is dead, start moving again.
          // defenders are removed in drawDefenders function
          if (defender.health <= 0) enemy.isMoving = true;
        }
      });
    });
  } else {
    // if there are no defenders, make sure all enemies are moving
    enemyManager.enemies.forEach(enemy => (enemy.isMoving = true));
  }
}

function restartGame(e) {
  // check if we clicked on the button
  if (
    !gameManager.gameIsRunning &&
    e.clientX >= canvas.width / 2 - 60 &&
    e.clientX <= canvas.width / 2 + 60 &&
    e.clientY >= canvas.height / 2 + 80 &&
    e.clientY <= canvas.height / 2 + 120
  ) {
    gameManager.gameIsRunning = true;
    // reset game variables
    gameManager.frames = 0;
    enemyManager.enemies = [];
    enemyManager.dyingEnemies = [];
    gameManager.ressources = 300;
    gameManager.baseHealth = 500;
    gameManager.victoryPoints = 0;
    grid.reset();
    gameLoop();
  }
}

function gameLoop() {
  // check if game is won or lost
  if (gameManager.baseHealth <= 0) {
    // todo: we have three times more or less the same code. Make this a generic "drawStartEndScreen" or something method
    // and simply pass in the variable parts, that is text and btn text!
    gameManager.gameIsRunning = false;
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
  } else if (gameManager.victoryPoints >= 100) {
    gameManager.gameIsRunning = false;
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

  // what do we do here essentially?
  // we draw stuff: the gameboard itself, the ui, enemies, defenders and projectiles
  // we "handle" stuff, that is, we do game logic: i.e. collision detection, movement, gaining ressources ...

  grid.draw();
  drawDefenders();
  handleProjectiles();

  enemyManager.generateEnemies();
  enemyManager.handleEnemies();
  handleCollisions();
  enemyManager.drawEnemies();
  enemyManager.handleDyingEnemies();
  drawGameInfo();

  gameManager.frames++;

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

document.addEventListener('mousemove', input.setMousePosition);
document.addEventListener('click', placeDefender);
document.addEventListener('click', restartGame);
