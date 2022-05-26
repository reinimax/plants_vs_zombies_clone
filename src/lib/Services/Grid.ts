import Cell from '../Model/Cell';

export default class Grid {
  constructor(canvasManager, input, cellSize) {
    this.canvasManager = canvasManager;
    this.input = input;
    this.cells = [];
    this.cellSize = cellSize;
    this.width = this.canvasManager.getCanvasWidth();
    this.height = this.canvasManager.getCanvasHeight();
  }

  createCells() {
    for (let x = 0; x < this.width; x += this.cellSize) {
      for (let y = this.cellSize; y < this.height; y += this.cellSize) {
        let cell = new Cell(x, y, this.cellSize);
        this.cells.push(cell);
      }
    }
  }

  reset() {
    this.cells = [];
    this.createCells();
  }

  // TODO: we can simply loop over the cells array - no need for nested for-loop!
  draw() {
    this.canvasManager.ctx.strokeStyle = '#000';
    for (let x = 0; x < this.width; x += this.cellSize) {
      for (let y = this.cellSize; y < this.height; y += this.cellSize) {
        // highlight the cell with the cursor
        if (
          this.input.mouseX &&
          this.input.mouseX > x &&
          this.input.mouseX < x + this.cellSize &&
          this.input.mouseY &&
          this.input.mouseY > y &&
          this.input.mouseY < y + this.cellSize
        ) {
          this.canvasManager.ctx.strokeStyle = '#0F0';
          this.canvasManager.ctx.beginPath();
          this.canvasManager.ctx.rect(x, y, this.cellSize, this.cellSize);
          this.canvasManager.ctx.stroke();
          this.canvasManager.ctx.strokeStyle = '#000';
        }
        // we can use this later if we want to toggle grid on/off
        else {
          this.canvasManager.ctx.beginPath();
          this.canvasManager.ctx.rect(x, y, this.cellSize, this.cellSize);
          this.canvasManager.ctx.stroke();
        }
      }
    }
  }

  /** Helper that returns an array of defender objects. */
  getDefendersArray() {
    return this.cells.reduce(function(defendersArr, cell) {
      if (cell.defender !== null) {
        defendersArr.push(cell.defender);
      }
      return defendersArr;
    }, []);
  }
}
