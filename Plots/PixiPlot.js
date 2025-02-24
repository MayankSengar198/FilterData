export class PixiPlot {
  constructor(canvasId) {
    this.container = document.getElementById(canvasId);

    // Set explicit width & height
    this.width = this.container.clientWidth || 500;
    this.height = this.container.clientHeight || 400;

    // Initialize Pixi.js Application
    this.app = new PIXI.Application({
      width: this.width,
      height: this.height,
      backgroundColor: 0x121212, // Dark background
      antialias: true,
    });

    // Clear previous children before appending
    this.container.innerHTML = "";
    this.container.appendChild(this.app.view);

    // Create a graphics object for plotting
    this.graphics = new PIXI.Graphics();
    this.app.stage.addChild(this.graphics);

    // Draw grid
    this.drawGrid();
  }

  // Function to draw grid
  drawGrid() {
    const grid = new PIXI.Graphics();
    grid.lineStyle(1, 0x444444, 0.5);

    // Vertical lines
    for (let x = 0; x < this.width; x += this.width / 10) {
      grid.moveTo(x, 0);
      grid.lineTo(x, this.height);
    }

    // Horizontal lines
    for (let y = 0; y < this.height; y += this.height / 10) {
      grid.moveTo(0, y);
      grid.lineTo(this.width, y);
    }

    this.app.stage.addChild(grid);
  }

  // Function to render data points
  renderPlot(dataValues) {
    this.graphics.clear();
    this.graphics.lineStyle(2, 0x007bff, 1); // Blue line

    const maxX = dataValues.length - 1;
    const maxY = 1000;
    const padding = 20;

    // Scaling factors
    const scaleX = (this.width - 2 * padding) / maxX;
    const scaleY = (this.height - 2 * padding) / maxY;

    this.graphics.moveTo(
      padding,
      this.height - padding - dataValues[0] * scaleY
    );

    for (let i = 1; i < dataValues.length; i++) {
      let x = padding + i * scaleX;
      let y = this.height - padding - dataValues[i] * scaleY;
      this.graphics.lineTo(x, y);
    }
  }

  // Function to update plot dynamically
  updatePlot(newData) {
    this.renderPlot(newData);
  }
}
