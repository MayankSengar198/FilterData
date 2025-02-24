export class WebGLPlot {
  constructor(canvas, data) {
    this.canvas = canvas;
    this.gl = this.canvas.getContext("webgl");

    if (!this.gl) {
      console.error("WebGL not supported!");
      return;
    }

    this.zoomFactor = 1.0; // Initial zoom level

    this.initGL();
    this.initShaders();
    this.initBuffers();
    this.setData(data); // Store and process initial data
    this.setupZoom(); // Add zoom event listener
  }

  // Initialize WebGL settings
  initGL() {
    this.gl.clearColor(0, 0, 0, 1);
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  }

  // Create and compile shaders
  initShaders() {
    const gl = this.gl;

    const vertexShaderSource = `
      attribute vec2 aPosition;
      uniform float uPointSize;
      uniform float uScale;
      void main() {
          gl_Position = vec4(aPosition * uScale, 0.0, 1.0);
          gl_PointSize = uPointSize;
      }
    `;

    const fragmentShaderSource = `
      precision mediump float;
      void main() {
          gl_FragColor = vec4(0.8, 0.0, 0.0, 1.0);  // Dark Red points
      }
    `;

    this.vertexShader = this.compileShader(
      gl.VERTEX_SHADER,
      vertexShaderSource
    );
    this.fragmentShader = this.compileShader(
      gl.FRAGMENT_SHADER,
      fragmentShaderSource
    );

    this.shaderProgram = gl.createProgram();
    gl.attachShader(this.shaderProgram, this.vertexShader);
    gl.attachShader(this.shaderProgram, this.fragmentShader);
    gl.linkProgram(this.shaderProgram);
    gl.useProgram(this.shaderProgram);

    this.uPointSize = gl.getUniformLocation(this.shaderProgram, "uPointSize");
    this.uScale = gl.getUniformLocation(this.shaderProgram, "uScale");

    gl.uniform1f(this.uPointSize, 2.0); // Set bold point size dynamically
    gl.uniform1f(this.uScale, this.zoomFactor); // Initialize zoom scale
  }

  // Compile individual shaders
  compileShader(type, source) {
    const gl = this.gl;
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error("Shader compilation error:", gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  // Create buffer for storing vertex data
  initBuffers() {
    const gl = this.gl;
    this.positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
  }

  // Store and process new data
  setData(data) {
    const gl = this.gl;
    this.numPoints = data.length;
    this.values = new Float32Array(this.numPoints * 2);

    // Normalize X and Y values
    const maxTime = this.numPoints;
    const minTime = 1;

    for (let i = 0; i < this.numPoints; i++) {
      const time = i + 1;

      // Normalize X: [minTime, maxTime] → [-1, 1]
      this.values[i * 2] = ((time - minTime) / (maxTime - minTime)) * 2 - 1;

      // Normalize Y: [1, 100] → [-1, 1]
      this.values[i * 2 + 1] = ((data[i] - 1) / (1000 - 1)) * 2 - 1;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.values, gl.STATIC_DRAW);
  }

  // Handle zooming via mouse scroll
  setupZoom() {
    this.canvas.addEventListener("wheel", (event) => {
      event.preventDefault();
      const zoomSpeed = 0.001; // Adjust zoom sensitivity

      if (event.deltaY < 0) {
        this.zoomFactor *= 1.1; // Zoom in
      } else {
        this.zoomFactor /= 1.1; // Zoom out
      }

      // Prevent zooming out too much
      this.zoomFactor = Math.max(0.1, Math.min(this.zoomFactor, 10));

      this.gl.uniform1f(this.uScale, this.zoomFactor);
      this.render();
    });
  }

  // Update the plot with new data
  updatePlot(newData) {
    this.setData(newData);
    this.render();
  }

  // Render the WebGL plot
  render() {
    const gl = this.gl;
    gl.clear(gl.COLOR_BUFFER_BIT);

    const aPosition = gl.getAttribLocation(this.shaderProgram, "aPosition");

    gl.enableVertexAttribArray(aPosition);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.POINTS, 0, this.numPoints);
  }
}
