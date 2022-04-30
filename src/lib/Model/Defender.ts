import Projectile from './Projectile';

export default class Defender implements GameObjectInterface {
  x: number;
  y: number;
  width: number;
  height: number;
  row: number;
  static cost = 100;
  /** Reference to the drawing context */
  ctx: CanvasRenderingContext2D;
  /** Array holding the projectiles of this defender */
  projectiles: Projectile[];

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
    this.ctx.fillText(this.health, this.x + 10, this.y + 30);
  }

  shoot() {
    this.projectiles.push(
      new Projectile(this.x, this.y, this.damage, this.row, this.ctx)
    );
  }
}
