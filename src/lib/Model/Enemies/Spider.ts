import enemy1SpriteSheet from '../../../assets/sprites/enemy1.png';
import CanvasManager from '../../Services/CanvasManager';
import EnemyBase from '../EnemyBase';

export default class Spider extends EnemyBase {
  constructor(y: number, cellSize: number, canvasManager: CanvasManager) {
    super(y, cellSize, canvasManager);
    this.spriteSheet.src = enemy1SpriteSheet;
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
  }
}
