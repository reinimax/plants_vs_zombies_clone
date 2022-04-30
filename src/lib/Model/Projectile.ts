export default class Projectile implements GameObjectInterface {
  x: number;
  y: number;
  width: number;
  height: number;
  row: number;
  /** Reference to the drawing context */
  ctx: CanvasRenderingContext2D;

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
    this.ctx.fillRect(
      this.x + this.width / 2,
      this.y + this.height / 2,
      this.width,
      this.height
    );
  }
}
