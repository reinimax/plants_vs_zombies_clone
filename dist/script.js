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
const enemy1_png_1 = __importDefault(__webpack_require__(/*! ./assets/sprites/enemy1.png */ "./src/assets/sprites/enemy1.png"));
const Defender_1 = __importDefault(__webpack_require__(/*! ./lib/Model/Defender */ "./src/lib/Model/Defender.ts"));
const ServiceContainer_1 = __importDefault(__webpack_require__(/*! ./lib/Core/ServiceContainer */ "./src/lib/Core/ServiceContainer.ts"));
const CanvasManager_1 = __importDefault(__webpack_require__(/*! ./lib/Services/CanvasManager */ "./src/lib/Services/CanvasManager.ts"));
const container = new ServiceContainer_1.default();
const canvas = document.querySelector('#canvas');
canvas.width = 600;
canvas.height = 400;
const ctx = canvas.getContext('2d');
container.set('canvasManager', CanvasManager_1.default, canvas);
const manager = container.get('canvasManager');
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
        this.spriteSheet.src = enemy1_png_1.default;
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
                    currentSprite: 99,
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
            }
            else {
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
            }
            else {
                //this.animation.currentSprite++;
            }
            //console.log(this.animation.currentSprite);
        }
        if (this.isMoving) {
            this.x -= this.speed;
        }
        //ctx.fillStyle = '#F00';
        //ctx.fillRect(this.x, this.y, cellSize, cellSize);
        /*ctx.drawImage(
          this.spriteSheet,
          this.frameX,
          (this.frameY - 15) * this.frameHeight + this.frameOffset,
          this.frameWidth,
          this.frameHeight,
          this.x,
          this.y,
          this.width,
          this.height
        );*/
        ctx.drawImage(this.spriteSheet, this.animation.startX, this.animation.startY +
            this.animation.currentSprite * this.animation.sizeY, this.animation.sizeX, this.animation.sizeY, this.x, this.y, this.width, this.height);
        // draw health info
        ctx.fillStyle = '#000';
        ctx.font = '16px Arial';
        ctx.fillText(this.health, this.x + 10, this.y + 20);
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
        return (this.x < x &&
            this.x + this.width > x &&
            this.y < y &&
            this.y + this.height > y);
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
    ctx.strokeStyle = '#000';
    for (let x = 0; x < canvas.width; x += cellSize) {
        for (let y = cellSize; y < canvas.height; y += cellSize) {
            // highlight the cell with the cursor
            if (mouseX &&
                mouseX > x &&
                mouseX < x + cellSize &&
                mouseY &&
                mouseY > y &&
                mouseY < y + cellSize) {
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
    if (!gameIsRunning) {
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
    if (ressources - Defender_1.default.cost < 0) {
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
    activeCell.defender = new Defender_1.default(activeCell.x, activeCell.y, activeCell.width, activeCell.height, cellSize, ctx);
    ressources -= Defender_1.default.cost;
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
    return enemies.some(enemy => enemy.row === row);
}
// this function draws all the info about game state
function drawGameInfo() {
    ctx.fillStyle = '#000';
    ctx.font = '20px Arial';
    ctx.fillText('Ressources: ' + ressources, 10, 30);
    ctx.fillText('Health of base: ' + baseHealth, 200, 30);
    ctx.fillText('Victory Points: ' + victoryPoints, 420, 30);
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
            enemies.forEach(enemy => {
                if (detectRowBasedCollision(defender, enemy)) {
                    // stop the enemy from moving
                    enemy.isMoving = false;
                    // reduce the health of the defender
                    // (debounce it a bit because it is very fast)
                    if (frames % 5 === 0)
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
        enemies.forEach(enemy => (enemy.isMoving = true));
    }
}
function restartGame(e) {
    // check if we clicked on the button
    if (!gameIsRunning &&
        e.clientX >= canvas.width / 2 - 60 &&
        e.clientX <= canvas.width / 2 + 60 &&
        e.clientY >= canvas.height / 2 + 80 &&
        e.clientY <= canvas.height / 2 + 120) {
        gameIsRunning = true;
        // reset the ctx text properties to their default
        ctx.textBaseline = 'alphabetic';
        ctx.textAlign = 'start';
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
        ctx.fillStyle = 'rgba(0,0,0,.5)';
        ctx.fillRect(0, 0, 600, 400);
        ctx.fillStyle = '#FFF';
        ctx.font = '30px Arial';
        // center the text
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';
        ctx.fillText('The enemies destroyed the base.', canvas.width / 2, canvas.height / 2 + 20);
        ctx.fillText('The game is lost!', canvas.width / 2, canvas.height / 2 - 20);
        // draw restart button
        ctx.fillStyle = '#FFF';
        ctx.fillRect(canvas.width / 2 - 60, canvas.height / 2 + 80, 120, 40);
        ctx.fillStyle = '#000';
        ctx.font = '20px Arial';
        ctx.fillText('PLAY AGAIN', canvas.width / 2, canvas.height / 2 + 100);
        return;
    }
    else if (victoryPoints >= 100) {
        gameIsRunning = false;
        ctx.fillStyle = 'rgba(0,0,0,.5)';
        ctx.fillRect(0, 0, 600, 400);
        ctx.fillStyle = '#FFF';
        ctx.font = '30px Arial';
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';
        ctx.fillText('The enemy forces suffered heavy losses', canvas.width / 2, canvas.height / 2 - 40);
        ctx.fillText('and are retreating.', canvas.width / 2, canvas.height / 2);
        ctx.fillText('You are victorious!', canvas.width / 2, canvas.height / 2 + 40);
        // draw restart button
        ctx.fillStyle = '#FFF';
        ctx.fillRect(canvas.width / 2 - 60, canvas.height / 2 + 80, 120, 40);
        ctx.fillStyle = '#000';
        ctx.font = '20px Arial';
        ctx.fillText('PLAY AGAIN', canvas.width / 2, canvas.height / 2 + 100);
        return;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
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
//gameLoop();
// create the cells once.
//createCells();
// draw the start screen
ctx.fillStyle = 'rgba(0,0,0,.5)';
ctx.fillRect(0, 0, 600, 400);
ctx.fillStyle = '#FFF';
ctx.font = '30px Arial';
ctx.textBaseline = 'middle';
ctx.textAlign = 'center';
ctx.fillText('Enemies are attacking our base!', canvas.width / 2, canvas.height / 2 - 40);
ctx.font = '20px Arial';
ctx.fillText('Place defenders with the mouse to defend the base.', canvas.width / 2, canvas.height / 2);
// draw restart button
ctx.fillStyle = '#FFF';
ctx.fillRect(canvas.width / 2 - 60, canvas.height / 2 + 80, 120, 40);
ctx.fillStyle = '#000';
ctx.font = '20px Arial';
ctx.fillText('START', canvas.width / 2, canvas.height / 2 + 100);
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
        this.services.set(name, function hi() {
            // todo: it would be nice to optionally provide a singleton
            return new service(...params);
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
    constructor(x, y, width, height, cellSize, ctx) {
        this.health = 100;
        this.damage = 20;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.row = y / cellSize;
        this.ctx = ctx;
        this.projectiles = [];
    }
    draw() {
        this.ctx.fillStyle = '#00F';
        this.ctx.fillRect(this.x, this.y, this.width, this.height);
        // draw health info
        this.ctx.fillStyle = '#000';
        this.ctx.font = '16px Arial';
        this.ctx.fillText(this.health.toString(), this.x + 10, this.y + 30);
    }
    shoot() {
        this.projectiles.push(new Projectile_1.default(this.x, this.y, this.damage, this.row, this.ctx));
    }
}
exports.default = Defender;
Defender.cost = 100;


/***/ }),

/***/ "./src/lib/Model/Projectile.ts":
/*!*************************************!*\
  !*** ./src/lib/Model/Projectile.ts ***!
  \*************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
class Projectile {
    constructor(x, y, damage, row, ctx) {
        this.damage = damage;
        this.x = x;
        this.y = y;
        this.width = 20;
        this.height = 20;
        this.row = row;
        this.speed = 0.5;
        this.ctx = ctx;
    }
    draw() {
        this.x += this.speed;
        this.ctx.fillStyle = '#FF0';
        this.ctx.fillRect(this.x + this.width / 2, this.y + this.height / 2, this.width, this.height);
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
}
exports.default = CanvasManager;


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