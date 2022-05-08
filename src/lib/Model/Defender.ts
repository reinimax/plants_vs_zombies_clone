import CanvasManager from '../Services/CanvasManager';
import Projectile from './Projectile';

export default class Defender implements GameObjectInterface {
  x: number;
  y: number;
  width: number;
  height: number;
  row: number;
  static cost = 100;
  /** Array holding the projectiles of this defender */
  projectiles: Projectile[];
  health: number;
  damage: number;
  /** Reference to the CanvasManager */
  canvasManager: CanvasManager;

  constructor(
    x: number,
    y: number,
    width: number,
    height: number,
    cellSize: number,
    canvasManager: CanvasManager
  ) {
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
    this.canvasManager.drawText(
      this.health.toString(),
      this.x + 10,
      this.y + 30,
      { fillStyle: '#000', font: '16px Arial' }
    );
  }

  shoot() {
    this.projectiles.push(
      new Projectile(this.x, this.y, this.damage, this.row, this.canvasManager)
    );
  }
}
