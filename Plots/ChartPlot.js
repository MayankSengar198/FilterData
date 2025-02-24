export class ChartPlot {
  constructor(canvasId) {
    this.ctx = document.getElementById(canvasId).getContext("2d");
    this.chart = null; // Store the chart instance
  }

  // Function to create & render the chart
  renderChart(dataValues) {
    if (this.chart) {
      this.chart.destroy(); // Destroy existing chart before re-rendering
    }

    this.chart = new Chart(this.ctx, {
      type: "line",
      data: {
        labels: dataValues.map((_, i) => i), // Use index as time value
        datasets: [
          {
            label: "Random Data",
            data: dataValues,
            borderColor: "orange",
            backgroundColor: "rgba(255, 140, 0, 0.5)",
            borderWidth: 1,
            pointRadius: 0, // Hide points for better performance
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { type: "linear", title: { display: true, text: "Time Index" } },
          y: { title: { display: true, text: "Value" } },
        },
      },
    });
  }

  // Function to update the chart with new data
  updatePlot(newDataValues) {
    if (this.chart) {
      this.chart.data.labels = newDataValues.map((_, i) => i);
      this.chart.data.datasets[0].data = newDataValues;
      this.chart.update();
    }
  }
}
