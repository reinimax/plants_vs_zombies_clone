export default class DefenderManager {
  constructor(
    gameManager: GameManager,
    canvasManager: CanvasManager,
    grid,
    enemyManager
  ) {
    this.gameManager = gameManager;
    this.canvasManager = canvasManager;
    this.grid = grid;
    this.enemyManager = enemyManager;
  }

  // actually, we could check when the cells are drawn if the cell has a defender and then handle him.
  drawDefenders() {
    let cellsWithDefenders = this.grid.cells.filter(
      cell => cell.defender !== null
    );
    cellsWithDefenders.forEach(cell => {
      // if defender health is 0 or below, remove him
      if (cell.defender.health <= 0) {
        cell.defender = null;
        return;
      }
      cell.defender.draw();
      if (
        this.enemyManager.detectEnemiesOnRow(cell.defender.row) &&
        this.gameManager.frames % 150 == 0
      )
        cell.defender.shoot();
    });
  }
}
