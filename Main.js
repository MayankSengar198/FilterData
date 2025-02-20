let dataValues = [];
let plot;

function run_wasm() {
  // console.log(dataValues); // Assuming Module is your Emscripten module
  const array = dataValues;
  const size = array.length;
  const threshold = document.getElementById("threshold").value;

  console.log("CurrentArray", array);

  // Allocate memory for the input array and newSize
  // Convert to Int32Array if necessary
  const intArray = new Int32Array(array);

  // Allocate memory for the Int32Array
  const arrayPtr = Module._malloc(intArray.length * intArray.BYTES_PER_ELEMENT);

  // Set the array in HEAP32
  Module.HEAP32.set(intArray, arrayPtr >> 2);

  const newSizePtr = Module._malloc(size); // Allocate memory for an integer
  console.log("c method call started", printTime());
  // Call the function
  const resultPtr = Module.ccall(
    "filterArray",
    "number", // Return type
    ["number", "number", "number", "number"], // Argument types
    [arrayPtr, size, threshold, newSizePtr] // Arguments
  );
  console.log("c method call end", printTime());

  // Get the new size from the memory
  const newSize = Module.getValue(newSizePtr, "i32");

  // Read the result array from memory
  const resultArray = Module.HEAP32.subarray(
    resultPtr >> 2,
    (resultPtr >> 2) + newSize
  );

  // Free the allocated memory
  Module._free(arrayPtr);
  Module._free(newSizePtr);
  Module._free(resultPtr);
  updateDatalength(resultArray.length);
  console.log("resultArray", Array.from(resultArray));
  console.log("update plot started", printTime());
  plot.updatePlot(Array.from(resultArray));
  console.log("update plot ended", printTime());
}

document.addEventListener("DOMContentLoaded", () => {
  const buttonDiv = document.getElementById("filter");
  const inputField = document.getElementById("threshold");

  // Click event for the button
  buttonDiv.onclick = run_wasm;

  // Keypress event for Enter key
  inputField.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
      run_wasm();
    }
  });
});

function printTime() {
  const currentDate = new Date();
  // Getting hours
  const hours = currentDate.getHours();

  // Getting minutes
  const minutes = currentDate.getMinutes();

  // Getting seconds
  const seconds = currentDate.getSeconds();

  // Using template literal for
  // printing the date and time
  // in console
  return `${hours}:${minutes}:${seconds}`;
}

// chartComponent.js

document.addEventListener("DOMContentLoaded", () => {
  // initializeChart();
  const canvas = document.getElementById("plotCanvas");

  const length = 100_000_00 * 2;
  updateDatalength(length);

  const data = generateRandomData(length);
  dataValues = data;
  console.log(dataValues);

  console.log("plot rendered started", printTime());
  plot = new WebGLPlot(canvas, data);
  plot.render();
  console.log("plot rendered ended", printTime());
});

function generateRandomData(size) {
  const data = new Uint16Array(size); // Using Uint16Array for values up to 1000

  for (let i = 0; i < size; i++) {
    data[i] = Math.floor(Math.random() * 1000); // Random number between 0-999
  }

  return data;
}

function updateDatalength(length) {
  const dataLengthElement = document.getElementById("dataLength");

  // Apply a fade-out effect before updating
  dataLengthElement.style.opacity = "0";

  setTimeout(() => {
    dataLengthElement.innerHTML = `<strong>${length}</strong>`;
    dataLengthElement.style.opacity = "1"; // Fade-in effect
  }, 300);
}

class WebGLPlot {
  constructor(canvas, data) {
    this.canvas = canvas;
    this.gl = this.canvas.getContext("webgl");

    if (!this.gl) {
      console.error("WebGL not supported!");
      return;
    }

    this.initGL();
    this.initShaders();
    this.initBuffers();
    this.setData(data); // Store and process initial data
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
            void main() {
                gl_Position = vec4(aPosition, 0.0, 1.0);
                gl_PointSize = 0.025;
            }
        `;
    const fragmentShaderSource = `
            precision mediump float;
            void main() {
                gl_FragColor = vec4(0.0, 1.0, 0.0, 1.0);  // Green points
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

    for (let i = 0; i < this.numPoints; i++) {
      this.values[i * 2] = (i / this.numPoints) * 2 - 1; // X-axis (time index)
      this.values[i * 2 + 1] = (data[i] / 1000) * 2 - 1; // Y-axis (scaled values)
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.values, gl.STATIC_DRAW);
  }

  // Update the plot with new data
  updatePlot(newData) {
    console.log("Updating plot with new data...");
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
