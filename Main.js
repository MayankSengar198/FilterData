import { WebGLPlot } from "./Plots/Plot.js";
import { ChartPlot } from "./Plots/ChartPlot.js";
import { PixiPlot } from "./Plots/PixiPlot.js";

let dataValues = [];
let plot;
let dataSize = 1000;

document.addEventListener("DOMContentLoaded", () => {
  // set callbacks
  const buttonDiv = document.getElementById("filter");
  const applyDiv = document.getElementById("applySize");

  // Click event for the button
  buttonDiv.onclick = run_wasm;
  applyDiv.onclick = setDataSize;

  const canvas = document.getElementById("plotCanvas");
  updateDatalength(dataSize);

  const data = generateRandomData(dataSize);
  dataValues = data;
  console.log(dataValues);

  console.log("plot rendered started", printTime());

  // Using WebGLPLot
  plot = new WebGLPlot(canvas, data);
  plot.render();

  // Using ChartPlot.js
  // plot = new ChartPlot("plotCanvas");
  // plot.renderChart(data);

  // Using PixiPlot.js
  // plot = new PixiPlot("plotCanvas");
  // plot.renderPlot(data);
  // console.log(plot);

  console.log("plot rendered ended", printTime());
});

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

function setDataSize() {
  const inputDataSize = document.getElementById("dataSize").value;
  updateDatalength(inputDataSize);
  dataValues = generateRandomData(inputDataSize);
  plot.updatePlot(dataValues);
  run_wasm();
}

function printTime() {
  const currentDate = new Date();
  const hours = currentDate.getHours();
  const minutes = currentDate.getMinutes();
  const seconds = currentDate.getSeconds();
  return `${hours}:${minutes}:${seconds}`;
}

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
