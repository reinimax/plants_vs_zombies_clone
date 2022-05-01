export default class CanvasManager {
  /** Reference to the canvas */
  private canvas: HTMLCanvasElement;

  /** Reference to the drawing context */
  private ctx: CanvasRenderingContext2D | null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = this.canvas.getContext('2d');
  }
}
