/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/game.ts":
/*!*********************!*\
  !*** ./src/game.ts ***!
  \*********************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
const Defender_1 = __importDefault(__webpack_require__(/*! ./lib/Model/Defender */ "./src/lib/Model/Defender.ts"));
const ServiceContainer_1 = __importDefault(__webpack_require__(/*! ./lib/Core/ServiceContainer */ "./src/lib/Core/ServiceContainer.ts"));
const CanvasManager_1 = __importDefault(__webpack_require__(/*! ./lib/Services/CanvasManager */ "./src/lib/Services/CanvasManager.ts"));
const GameManager_1 = __importDefault(__webpack_require__(/*! ./lib/Services/GameManager */ "./src/lib/Services/GameManager.ts"));
const EnemyManager_1 = __importDefault(__webpack_require__(/*! ./lib/Services/EnemyManager */ "./src/lib/Services/EnemyManager.ts"));
const container = new ServiceContainer_1.default();
const canvas = document.querySelector('#canvas');
canvas.width = 600;
canvas.height = 400;
// set container instances and create service classes
container.set('canvasManager', CanvasManager_1.default, canvas);
container.set('gameManager', GameManager_1.default);
const canvasManager = container.get('canvasManager');
const gameManager = container.get('gameManager');
container.set('enemyManager', EnemyManager_1.default, gameManager, canvasManager);
const enemyManager = container.get('enemyManager');
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
let mouseX = undefined;
let mouseY = undefined;
let cells = [];
class Cell {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = gameManager.cellSize;
        this.height = gameManager.cellSize;
        this.defender = null;
        this.row = y / gameManager.cellSize;
    }
    isHoverdOver(x, y) {
        return (this.x < x &&
            this.x + this.width > x &&
            this.y < y &&
            this.y + this.height > y);
    }
}
// create the cell objects
function createCells() {
    for (let x = 0; x < canvas.width; x += gameManager.cellSize) {
        for (let y = gameManager.cellSize; y < canvas.height; y += gameManager.cellSize) {
            let cell = new Cell(x, y);
            cells.push(cell);
        }
    }
}
// TODO: naming of the function is not good. It actually defines mouse position, not highlighting it!
function highlightMouseCell(e) {
    // only perform this action every 2 frames (primitive debounce).
    if (gameManager.frames % 2 === 0) {
        // console.log(e);
        // console.log(canvas);
        // if the mouse is not inside the canvas, return
        if (e.clientX - canvas.offsetLeft < 0 || // left
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
    for (let x = 0; x < canvas.width; x += gameManager.cellSize) {
        for (let y = gameManager.cellSize; y < canvas.height; y += gameManager.cellSize) {
            // highlight the cell with the cursor
            if (mouseX &&
                mouseX > x &&
                mouseX < x + gameManager.cellSize &&
                mouseY &&
                mouseY > y &&
                mouseY < y + gameManager.cellSize) {
                canvasManager.ctx.strokeStyle = '#0F0';
                canvasManager.ctx.beginPath();
                canvasManager.ctx.rect(x, y, gameManager.cellSize, gameManager.cellSize);
                canvasManager.ctx.stroke();
                canvasManager.ctx.strokeStyle = '#000';
            }
            // we can use this later if we want to toggle grid on/off
            else {
                canvasManager.ctx.beginPath();
                canvasManager.ctx.rect(x, y, gameManager.cellSize, gameManager.cellSize);
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
                if (defender.projectiles[i].x + defender.projectiles[i].width >=
                    enemy.x &&
                    defender.projectiles[i].row === enemy.row) {
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
    let activeCellArr = cells.filter(cell => cell.isHoverdOver(mouseX, mouseY));
    if (activeCellArr.length !== 1)
        return;
    let activeCell = activeCellArr[0];
    if (activeCell.defender) {
        console.log('there is already a defender on this tile');
        return;
    }
    // check if we can afford the defender
    if (gameManager.ressources - Defender_1.default.cost < 0) {
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
    activeCell.defender = new Defender_1.default(activeCell.x, activeCell.y, activeCell.width, activeCell.height, gameManager.cellSize, canvasManager);
    gameManager.ressources -= Defender_1.default.cost;
    console.log(activeCell);
}
/** Helper that returns an array of defender objects. */
function getDefendersArray() {
    return cells.reduce(function (defendersArr, cell) {
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
    canvasManager.drawText('Victory Points: ' + gameManager.victoryPoints, 420, 30);
}
// handle collision detection between defenders and enemies
function detectRowBasedCollision(defender, enemy) {
    return (defender.x + defender.width >= enemy.x &&
        // without this condition, it would not be able to place
        // defenders to the right of enemies
        defender.x < enemy.x + enemy.width &&
        defender.row === enemy.row);
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
                    if (gameManager.frames % 5 === 0)
                        defender.health -= 1;
                    // if the defender is dead, start moving again.
                    // defenders are removed in drawDefenders function
                    if (defender.health <= 0)
                        enemy.isMoving = true;
                }
            });
        });
    }
    else {
        // if there are no defenders, make sure all enemies are moving
        enemyManager.enemies.forEach(enemy => (enemy.isMoving = true));
    }
}
function restartGame(e) {
    // check if we clicked on the button
    if (!gameManager.gameIsRunning &&
        e.clientX >= canvas.width / 2 - 60 &&
        e.clientX <= canvas.width / 2 + 60 &&
        e.clientY >= canvas.height / 2 + 80 &&
        e.clientY <= canvas.height / 2 + 120) {
        gameManager.gameIsRunning = true;
        // reset game variables
        gameManager.frames = 0;
        enemyManager.enemies = [];
        enemyManager.dyingEnemies = [];
        gameManager.ressources = 300;
        gameManager.baseHealth = 500;
        gameManager.victoryPoints = 0;
        cells = [];
        gameLoop();
        createCells();
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
        canvasManager.drawText('The enemies destroyed the base.', canvas.width / 2, canvas.height / 2 + 20, options);
        canvasManager.drawText('The game is lost!', canvas.width / 2, canvas.height / 2 - 20, options);
        // draw restart button
        canvasManager.drawFilledRect(canvas.width / 2 - 60, canvas.height / 2 + 80, 120, 40, { fillStyle: '#FFF' });
        canvasManager.drawText('PLAY AGAIN', canvas.width / 2, canvas.height / 2 + 100, {
            textBaseline: 'middle',
            textAlign: 'center'
        });
        return;
    }
    else if (gameManager.victoryPoints >= 100) {
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
        canvasManager.drawText('The enemy forces suffered heavy losses', canvas.width / 2, canvas.height / 2 - 40, options);
        canvasManager.drawText('and are retreating.', canvas.width / 2, canvas.height / 2, options);
        canvasManager.drawText('You are victorious!', canvas.width / 2, canvas.height / 2 + 40, options);
        // draw restart button
        canvasManager.drawFilledRect(canvas.width / 2 - 60, canvas.height / 2 + 80, 120, 40, { fillStyle: '#FFF' });
        canvasManager.drawText('PLAY AGAIN', canvas.width / 2, canvas.height / 2 + 100, {
            textBaseline: 'middle',
            textAlign: 'center'
        });
        return;
    }
    canvasManager.ctx.clearRect(0, 0, canvas.width, canvas.height);
    // what do we do here essentially?
    // we draw stuff: the gameboard itself, the ui, enemies, defenders and projectiles
    // we "handle" stuff, that is, we do game logic: i.e. collision detection, movement, gaining ressources ...
    drawGrid();
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
canvasManager.drawText('Enemies are attacking our base!', canvas.width / 2, canvas.height / 2 - 40, options);
canvasManager.drawText('Place defenders with the mouse to defend the base.', canvas.width / 2, canvas.height / 2, { textBaseline: 'middle', textAlign: 'center', fillStyle: '#FFF' });
// draw restart button
canvasManager.drawFilledRect(canvas.width / 2 - 60, canvas.height / 2 + 80, 120, 40, { fillStyle: '#FFF' });
canvasManager.drawText('START', canvas.width / 2, canvas.height / 2 + 100, {
    textBaseline: 'middle',
    textAlign: 'center'
});
document.addEventListener('mousemove', highlightMouseCell);
document.addEventListener('click', placeDefender);
document.addEventListener('click', restartGame);


/***/ }),

/***/ "./src/lib/Core/ServiceContainer.ts":
/*!******************************************!*\
  !*** ./src/lib/Core/ServiceContainer.ts ***!
  \******************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
class ServiceContainer {
    constructor() {
        this.services = new Map();
    }
    set(name, service, ...params) {
        if (typeof this.services.get(name) === 'function') {
            throw new Error(`Key ${name} already exists in the service container.`);
        }
        this.services.set(name, function lazyBuilder() {
            // todo: it would be nice to optionally provide a singleton
            if (typeof lazyBuilder.instance === 'undefined') {
                lazyBuilder.instance = new service(...params);
            }
            return lazyBuilder.instance;
        });
    }
    get(name) {
        const callback = this.services.get(name);
        if (typeof callback === 'undefined') {
            throw new Error(`Key ${name} does not exist.`);
        }
        if (typeof callback !== 'function') {
            throw new Error(`Key ${name} does is not mapped to a function.`);
        }
        return callback();
    }
}
exports.default = ServiceContainer;


/***/ }),

/***/ "./src/lib/Model/Defender.ts":
/*!***********************************!*\
  !*** ./src/lib/Model/Defender.ts ***!
  \***********************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
const Projectile_1 = __importDefault(__webpack_require__(/*! ./Projectile */ "./src/lib/Model/Projectile.ts"));
class Defender {
    constructor(x, y, width, height, cellSize, canvasManager) {
        this.health = 100;
        this.damage = 20;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.row = y / cellSize;
        this.canvasManager = canvasManager;
        this.projectiles = [];
    }
    draw() {
        this.canvasManager.drawFilledRect(this.x, this.y, this.width, this.height, {
            fillStyle: '#00F'
        });
        // draw health info
        this.canvasManager.drawText(this.health.toString(), this.x + 10, this.y + 30, { fillStyle: '#000', font: '16px Arial' });
    }
    shoot() {
        this.projectiles.push(new Projectile_1.default(this.x, this.y, this.damage, this.row, this.canvasManager));
    }
}
exports.default = Defender;
Defender.cost = 100;


/***/ }),

/***/ "./src/lib/Model/Enemies/Spider.ts":
/*!*****************************************!*\
  !*** ./src/lib/Model/Enemies/Spider.ts ***!
  \*****************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
const enemy1_png_1 = __importDefault(__webpack_require__(/*! ../../../assets/sprites/enemy1.png */ "./src/assets/sprites/enemy1.png"));
const EnemyBase_1 = __importDefault(__webpack_require__(/*! ../EnemyBase */ "./src/lib/Model/EnemyBase.ts"));
class Spider extends EnemyBase_1.default {
    constructor(y, cellSize, canvasManager) {
        super(y, cellSize, canvasManager);
        this.spriteSheet.src = enemy1_png_1.default;
        this.spriteSheetInfo = {
            width: 258,
            height: 6780,
            animationSets: {
                move: {
                    numOfSprites: 5,
                    currentSprite: -1,
                    startX: 0,
                    startY: 5490,
                    sizeX: 258,
                    sizeY: 258
                },
                die: {
                    numOfSprites: 10,
                    currentSprite: -1,
                    startX: 0,
                    startY: 2940,
                    sizeX: 258,
                    sizeY: 258
                },
                attack: {
                    numOfSprites: 15,
                    currentSprite: -1,
                    startX: 0,
                    startY: 0,
                    sizeX: 258,
                    sizeY: 194
                }
            }
        };
    }
}
exports.default = Spider;


/***/ }),

/***/ "./src/lib/Model/EnemyBase.ts":
/*!************************************!*\
  !*** ./src/lib/Model/EnemyBase.ts ***!
  \************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
class EnemyBase {
    constructor(y, cellSize, canvasManager) {
        this.canvasManager = canvasManager;
        this.health = 100;
        this.worth = 50;
        this.damage = 20;
        this.y = y;
        this.x = canvasManager.getCanvasWidth();
        this.width = cellSize;
        this.height = cellSize;
        this.speed = 0.5;
        this.isMoving = true;
        this.row = y / cellSize;
        this.victoryPoints = 5;
        this.spriteSheet = new Image();
        this.spriteSheetInfo = {};
        this.animation = null;
        this.debounce = 0;
        this.dyingAnimationPlayed = false;
    }
    draw() {
        if (this.health <= 0) {
            this.animation = this.spriteSheetInfo.animationSets.die;
        }
        else if (this.isMoving) {
            this.x -= this.speed;
            this.animation = this.spriteSheetInfo.animationSets.move;
        }
        // if the enemy is not moving, it means it reached a defender and should therefore attack
        else {
            this.animation = this.spriteSheetInfo.animationSets.attack;
        }
        // debounce animation
        if (this.debounce % 10 === 0) {
            // new try with animation variable
            // we increment the sprite first and the check if it exceeds the limit. Keep in mind, it is 5 sprites here, but we
            // start at 0! So we actually have indices 0-4. If the index reaches 5, we must reset it to 0.
            // Another option is to keep the if-else structure, but then we need to move this code below the drawImage function!
            // Otherwise this happens: we come in with index 4, which still triggers the else part of the statement. So we increment
            // it to 5 and draw index 5 which is actually too big.
            // We could also subtract -1 from numOfSprites in the if-statement to account for starting at 0. maybe this would be
            // most reasonable.
            if (this.animation.currentSprite >= this.animation.numOfSprites - 1) {
                this.animation.currentSprite = 0;
                if (this.health <= 0) {
                    this.dyingAnimationPlayed = true;
                }
            }
            else {
                this.animation.currentSprite++;
            }
        }
        this.canvasManager.ctx.drawImage(this.spriteSheet, this.animation.startX, this.animation.startY +
            this.animation.currentSprite * this.animation.sizeY, this.animation.sizeX, this.animation.sizeY, this.x, this.y, this.width, this.height);
        // draw health info
        this.canvasManager.drawText(this.health.toString(), this.x + 10, this.y + 20, {
            fillStyle: '#000',
            font: '16px Arial'
        });
        this.debounce++;
    }
}
exports.default = EnemyBase;


/***/ }),

/***/ "./src/lib/Model/Projectile.ts":
/*!*************************************!*\
  !*** ./src/lib/Model/Projectile.ts ***!
  \*************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
class Projectile {
    constructor(x, y, damage, row, canvasManager) {
        this.damage = damage;
        this.x = x;
        this.y = y;
        this.width = 20;
        this.height = 20;
        this.row = row;
        this.speed = 0.5;
        this.canvasManager = canvasManager;
    }
    draw() {
        this.x += this.speed;
        this.canvasManager.drawFilledRect(this.x + this.width / 2, this.y + this.height / 2, this.width, this.height, { fillStyle: '#FF0' });
    }
}
exports.default = Projectile;


/***/ }),

/***/ "./src/lib/Services/CanvasManager.ts":
/*!*******************************************!*\
  !*** ./src/lib/Services/CanvasManager.ts ***!
  \*******************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
class CanvasManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = this.canvas.getContext('2d');
    }
    drawText(text, x, y, options = {}) {
        let props = Object.keys(options);
        if (props.length > 0) {
            props.forEach(key => (this.ctx[key] = options[key]));
        }
        this.ctx.fillText(text, x, y);
        this.reset();
    }
    drawFilledRect(x, y, width, height, options = {}) {
        let props = Object.keys(options);
        if (props.length > 0) {
            props.forEach(key => (this.ctx[key] = options[key]));
        }
        this.ctx.fillRect(x, y, width, height);
        this.reset();
    }
    getCanvasWidth() {
        return this.canvas.width;
    }
    getCanvasHeight() {
        return this.canvas.height;
    }
    /**
     * Resets the canvas properties to their default state.
     * This function is meant to only be called within the service.
     */
    reset() {
        this.ctx.textBaseline = 'alphabetic';
        this.ctx.textAlign = 'start';
        this.ctx.fillStyle = '#000000';
        this.ctx.filter = 'none';
        this.ctx.font = '20px Arial';
        this.ctx.globalAlpha = 1;
        this.ctx.globalCompositeOperation = 'source-over';
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.lineWidth = 1;
        this.ctx.shadowBlur = 0;
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0)';
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 0;
        this.ctx.strokeStyle = '#000000';
    }
}
exports.default = CanvasManager;


/***/ }),

/***/ "./src/lib/Services/EnemyManager.ts":
/*!******************************************!*\
  !*** ./src/lib/Services/EnemyManager.ts ***!
  \******************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
const Spider_1 = __importDefault(__webpack_require__(/*! ../Model/Enemies/Spider */ "./src/lib/Model/Enemies/Spider.ts"));
class EnemyManager {
    constructor(gameManager, canvasManager) {
        this.gameManager = gameManager;
        this.canvasManager = canvasManager;
        this.enemies = [];
        this.dyingEnemies = [];
    }
    generateEnemies() {
        // we add cellsize to account for the uppermost part of the
        // canvas that is not part of the gamebord
        let randomRow = Math.floor(Math.random() * this.gameManager.numOfRows) *
            this.gameManager.cellSize +
            this.gameManager.cellSize;
        if (this.gameManager.frames % 150 === 0) {
            this.enemies.push(new Spider_1.default(randomRow, this.gameManager.cellSize, this.canvasManager));
        }
    }
    drawEnemies() {
        this.enemies.forEach(enemy => {
            enemy.draw();
        });
    }
    handleEnemies() {
        // if an enemy leaves the board, damage the base and
        // remove him from the enemies array
        for (let i = 0; i < this.enemies.length; i++) {
            this.enemies[i].isMoving = true;
            // remove dead this. and grant ressources
            if (this.enemies[i].health <= 0) {
                this.gameManager.ressources += this.enemies[i].worth;
                this.gameManager.victoryPoints += this.enemies[i].victoryPoints;
                let deadEnemy = this.enemies.splice(i, 1);
                this.dyingEnemies.push(deadEnemy[0]);
                i--;
                continue;
            }
            if (this.enemies[i].x < 0 - this.gameManager.cellSize) {
                // damage the base
                this.gameManager.baseHealth -= this.enemies[i].damage;
                // remove enemy from the array
                this.enemies.splice(i, 1);
                // decrement i because array gets shorter
                // in practice this should be nigh irrelevant because though
                // it prevents "jumping" over the next array element, both
                // elements would need to be outside the gameboard on the
                // exact same frame
                i--;
            }
        }
    }
    handleDyingEnemies() {
        for (let i = 0; i < this.dyingEnemies.length; i++) {
            if (this.dyingEnemies[i].dyingAnimationPlayed) {
                this.dyingEnemies.splice(i, 1);
                i--;
                continue;
            }
            this.dyingEnemies[i].draw();
        }
    }
}
exports.default = EnemyManager;


/***/ }),

/***/ "./src/lib/Services/GameManager.ts":
/*!*****************************************!*\
  !*** ./src/lib/Services/GameManager.ts ***!
  \*****************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
class GameManager {
    constructor() {
        this.cellSize = 50;
        this.numOfRows = 7;
        this.ressources = 300;
        // health of the base. If it falls below 0 the game is lost
        this.baseHealth = 500;
        // victory points are awarded when an enemy is killed. If enough are reached, the player wins
        this.victoryPoints = 0;
        this.gameIsRunning = false;
        this.frames = 0;
    }
}
exports.default = GameManager;


/***/ }),

/***/ "./src/assets/sprites/enemy1.png":
/*!***************************************!*\
  !*** ./src/assets/sprites/enemy1.png ***!
  \***************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = __webpack_require__.p + "07854054d7e745df64b3.png";

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/global */
/******/ 	(() => {
/******/ 		__webpack_require__.g = (function() {
/******/ 			if (typeof globalThis === 'object') return globalThis;
/******/ 			try {
/******/ 				return this || new Function('return this')();
/******/ 			} catch (e) {
/******/ 				if (typeof window === 'object') return window;
/******/ 			}
/******/ 		})();
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/publicPath */
/******/ 	(() => {
/******/ 		var scriptUrl;
/******/ 		if (__webpack_require__.g.importScripts) scriptUrl = __webpack_require__.g.location + "";
/******/ 		var document = __webpack_require__.g.document;
/******/ 		if (!scriptUrl && document) {
/******/ 			if (document.currentScript)
/******/ 				scriptUrl = document.currentScript.src
/******/ 			if (!scriptUrl) {
/******/ 				var scripts = document.getElementsByTagName("script");
/******/ 				if(scripts.length) scriptUrl = scripts[scripts.length - 1].src
/******/ 			}
/******/ 		}
/******/ 		// When supporting browsers where an automatic publicPath is not supported you must specify an output.publicPath manually via configuration
/******/ 		// or pass an empty string ("") and set the __webpack_public_path__ variable from your code to use your own logic.
/******/ 		if (!scriptUrl) throw new Error("Automatic publicPath is not supported in this browser");
/******/ 		scriptUrl = scriptUrl.replace(/#.*$/, "").replace(/\?.*$/, "").replace(/\/[^\/]+$/, "/");
/******/ 		__webpack_require__.p = scriptUrl;
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __webpack_require__("./src/game.ts");
/******/ 	
/******/ })()
;
//# sourceMappingURL=script.js.map