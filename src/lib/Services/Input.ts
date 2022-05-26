export default class Input {
  constructor(gameManager, canvas) {
    this.gameManager = gameManager;
    this.canvas = canvas;
    this.mouseX = undefined;
    this.mouseY = undefined;
    // since setMousePosition is invoked by an event handler, we must bind this tonot lose it
    this.setMousePosition = this.setMousePosition.bind(this);
  }

  setMousePosition(e) {
    // only perform this action every 2 frames (primitive debounce).
    if (this.gameManager.frames % 2 === 0) {
      // console.log(e);
      // console.log(canvas);

      // if the mouse is not inside the canvas, return
      if (
        e.clientX - this.canvas.offsetLeft < 0 || // left
        e.clientX - this.canvas.offsetLeft > this.canvas.width || // right
        e.clientY - this.canvas.offsetTop < 0 || // top
        e.clientY - this.canvas.offsetTop > this.canvas.height // bottom
      ) {
        this.mouseX = undefined;
        this.mouseY = undefined;
        return;
      }
      this.mouseX = e.clientX - this.canvas.offsetLeft;
      this.mouseY = e.clientY - this.canvas.offsetTop;

      // console.log('mouseX: ' + mouseX);
      // console.log('mouseY: ' + mouseY);
    }
  }
}
