export default class GameManager {
  constructor() {
    this.cellSize = 50;
    this.numOfRows = 7;
    this.ressources = 300;
    // health of the base. If it falls below 0 the game is lost
    this.baseHealth = 500;
    // victory points are awarded when an enemy is killed. If enough are reached, the player wins
    this.victoryPoints = 0;
    this.gameIsRunning = false;
    this.frames = 0;
  }
}
