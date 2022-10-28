class DotPlot {
    constructor(targetElementName, data, margin={ top: 10,
                                                  right: 30,
                                                  bottom: 30,
                                                  left: 30 }) {
        // Find the target element in the DOM
        this.targetElement = d3.select(`#${targetElementName}`);
        // Clear the element contents
        this.targetElement.html("");

        // Save the margins for later
        this.margin = margin;

        // Compute the width and height of our container
        this.width = parseInt(this.targetElement.style('width'), 10)
        this.height = parseInt(this.targetElement.style('height'), 10)

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
                                     .attr("width", this.width + margin.left + margin.right)
                                     .attr("height", this.height + margin.top + margin.bottom)
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
                  .range([ 0, this.width ]);

        // X axis
        this.svg.append("g")
                .attr("transform", `translate(0, ${this.height})`)
                .call(d3.axisBottom(x));

        /////////
        // Y axis
        /////////

        // Y scaler
        let y = d3.scaleBand()
                  .range([ 0, this.height ])
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
                .style("fill", "green");
    }
}