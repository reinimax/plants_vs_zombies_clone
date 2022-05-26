import EnemyBase from '../Model/EnemyBase';
import GameManager from './GameManager';
import Spider from '../Model/Enemies/Spider';
import CanvasManager from './CanvasManager';

export default class EnemyManager {
  enemies: Array<EnemyBase>;
  dyingEnemies: Array<EnemyBase>;
  gameManager: GameManager;
  canvasManager: CanvasManager;

  constructor(gameManager: GameManager, canvasManager: CanvasManager) {
    this.gameManager = gameManager;
    this.canvasManager = canvasManager;
    this.enemies = [];
    this.dyingEnemies = [];
  }

  generateEnemies() {
    // we add cellsize to account for the uppermost part of the
    // canvas that is not part of the gamebord
    let randomRow =
      Math.floor(Math.random() * this.gameManager.numOfRows) *
        this.gameManager.cellSize +
      this.gameManager.cellSize;
    if (this.gameManager.frames % 150 === 0) {
      this.enemies.push(
        new Spider(randomRow, this.gameManager.cellSize, this.canvasManager)
      );
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
