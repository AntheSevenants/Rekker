class DotPlot {
    constructor(targetElementName, data, margin={ top: 0,
                                                  right: 30,
                                                  bottom: 30,
                                                  left: 50 }) {
        // Find the target element in the DOM
        this.targetElement = d3.select(`#${targetElementName}`);
        // Clear the element contents
        this.targetElement.html("");

        // Save the margins for later
        this.margin = margin;

        // Compute the width and height of our container
        this.width = parseInt(this.targetElement.style('width'), 10)
        this.height = parseInt(this.targetElement.style('height'), 10)

        this.chartRangeWidth = this.width - this.margin.left - this.margin.right;
        this.chartRangeHeight = this.height - this.margin.top - this.margin.bottom;

        // Save the data
        this.data = data;

        // Compute minimum and maximum values
        this.coefficients = this.data.map(row => row.coefficients);
        this.minimumValue = +Math.min(...this.coefficients);
        this.maximumValue = +Math.max(...this.coefficients);
    }

    initPlot() {
        // Just a shorthand
        let margin = this.margin;

        // Append the SVG to our target element
        this.svg = this.targetElement.append("svg")
                                     .attr("width", this.width)
                                     .attr("height", this.height)
                                     .append("g")
                                     .attr("transform", `translate(${margin.left}, ${margin.top})`);                            
    }

    drawPlot() {
        /////////
        // X axis
        /////////

        // X scaler
        let x = d3.scaleLinear()
                  .domain([ this.minimumValue, this.maximumValue ])
                  .range([ 0, this.chartRangeWidth ]);

        // X axis
        this.svg.append("g")
                .attr("transform", `translate(0, ${this.chartRangeHeight})`)
                .call(d3.axisBottom(x));

        /////////
        // Y axis
        /////////

        // Y scaler
        let y = d3.scaleBand()
                  .range([ 0, this.chartRangeHeight ])
                  .domain(this.data.map(row => row.features))
                  .padding(1);

        // Y axis
        this.svg.append("g")
                .call(d3.axisLeft(y));

        // Draw data points
        this.svg.selectAll("circle")
                .data(this.data)
                .join("circle")
                .attr("cx", d => x(d.coefficients))
                .attr("cy", d => y(d.features))
                .attr("r", "6")
                // I mimick the R studio colour scheme
                .style("fill", d => d.coefficients < 0 ? "#F8766D" : "#00BFC4");

        // Add zero reference
        let lineLayer = this.svg.append("g") // create another SVG group
                                .attr("transform", "translate(0, 0)");

        lineLayer.append("line")
                 .attr("id", "baseline")
                 .attr("x1", x(0))  
                 .attr("y1", 0)
                 .attr("x2", x(0))
                 .attr("y2", this.chartRangeHeight)
                 .style("stroke-width", 2)
                 .attr("stroke-dasharray", "8,8")
                 .style("stroke", "#a6a6a6")
                 .style("fill", "none");
    }
}