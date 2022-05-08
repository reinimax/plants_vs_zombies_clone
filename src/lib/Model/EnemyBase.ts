import CanvasManager from '../Services/CanvasManager';

export default abstract class EnemyBase
  implements GameObjectInterface, Moveable, MyAnimatable {
  x: number;
  y: number;
  width: number;
  height: number;
  row: number;
  health: number;
  damage: number;
  worth: number;
  /** Reference to the CanvasManager */
  canvasManager: CanvasManager;
  speed: number;
  isMoving: boolean;
  spriteSheet: HTMLImageElement;
  animation: Object | null;
  spriteSheetInfo: Object;
  victoryPoints: number;
  debounce: number;
  dyingAnimationPlayed: boolean;

  constructor(y: number, cellSize: number, canvasManager: CanvasManager) {
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
    } else if (this.isMoving) {
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
      } else {
        this.animation.currentSprite++;
      }
    }

    this.canvasManager.ctx.drawImage(
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
    this.canvasManager.drawText(
      this.health.toString(),
      this.x + 10,
      this.y + 20,
      {
        fillStyle: '#000',
        font: '16px Arial'
      }
    );

    this.debounce++;
  }
}
