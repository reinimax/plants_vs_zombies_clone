import CanvasManager from '../Services/CanvasManager';

export default class Projectile implements GameObjectInterface {
  x: number;
  y: number;
  width: number;
  height: number;
  row: number;

  damage: number;
  speed: number;
  /** Reference to the CanvasManager */
  canvasManager: CanvasManager;

  constructor(
    x: number,
    y: number,
    damage: number,
    row: number,
    canvasManager: CanvasManager
  ) {
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
    this.canvasManager.drawFilledRect(
      this.x + this.width / 2,
      this.y + this.height / 2,
      this.width,
      this.height,
      { fillStyle: '#FF0' }
    );
  }
}
