export default class CanvasManager {
  /** Reference to the canvas */
  private canvas: HTMLCanvasElement;

  /** Reference to the drawing context */
  private ctx: CanvasRenderingContext2D | null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = this.canvas.getContext('2d');
  }

  public drawText(text: string, x: number, y: number, options = {}) {
    let props = Object.keys(options);
    if (props.length > 0) {
      props.forEach(key => (this.ctx[key] = options[key]));
    }
    this.ctx!.fillText(text, x, y);
    this.reset();
  }

  public drawFilledRect(
    x: number,
    y: number,
    width: number,
    height: number,
    options = {}
  ) {
    let props = Object.keys(options);
    if (props.length > 0) {
      props.forEach(key => (this.ctx[key] = options[key]));
    }
    this.ctx!.fillRect(x, y, width, height);
    this.reset();
  }

  /**
   * Resets the canvas properties to their default state.
   * This function is meant to only be called within the service.
   */
  private reset() {
    this.ctx!.textBaseline = 'alphabetic';
    this.ctx!.textAlign = 'start';
    this.ctx!.fillStyle = '#000000';
    this.ctx!.filter = 'none';
    this.ctx!.font = '20px Arial';
    this.ctx!.globalAlpha = 1;
    this.ctx!.globalCompositeOperation = 'source-over';
    this.ctx!.imageSmoothingEnabled = true;
    this.ctx!.lineWidth = 1;
    this.ctx!.shadowBlur = 0;
    this.ctx!.shadowColor = 'rgba(0, 0, 0, 0)';
    this.ctx!.shadowOffsetX = 0;
    this.ctx!.shadowOffsetY = 0;
    this.ctx!.strokeStyle = '#000000';
  }
}
