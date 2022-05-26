export default class Cell {
  constructor(x, y, cellSize) {
    this.x = x;
    this.y = y;
    this.width = cellSize;
    this.height = cellSize;
    this.defender = null;
    this.row = y / cellSize;
  }

  isHoverdOver(x, y) {
    return (
      this.x < x &&
      this.x + this.width > x &&
      this.y < y &&
      this.y + this.height > y
    );
  }
}
