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

        // Save the data
        this.data = data;

        // Set element height depending on how many data points there are
        this.targetElement.style("height", `${this.data.length * 10}px`);

        // Compute the width and height of our container
        this.width = parseInt(this.targetElement.style('width'), 10)
        this.height = parseInt(this.targetElement.style('height'), 10)

        this.chartRangeHeight = this.height - this.margin.top - this.margin.bottom;

        // Compute minimum and maximum values
        this.coefficients = this.data.map(row => row.coefficients);
        this.minimumValue = +Math.min(...this.coefficients);
        this.maximumValue = +Math.max(...this.coefficients);
    }

    initPlot() {
        // Append the SVG to our target element
        this.svg = this.targetElement.append("svg")
                                     .attr("width", this.width)
                                     .attr("height", this.height)
                                     .append("g");
    }

    setMargins() {
        this.chartRangeWidth = this.width - this.margin.left - this.margin.right;

        this.svg.attr("transform", `translate(${this.margin.left}, ${this.margin.top})`);
    }

    drawPlot() {
        /////////
        // Y axis
        /////////

        // Y scaler
        let y = d3.scaleBand()
                  .range([ 0, this.chartRangeHeight ])
                  .domain(this.data.map(row => row.features))
                  .padding(1);

        // Y axis
        let yAxis = this.svg.append("g")
                            .call(d3.axisLeft(y));

        let recommendedLeftMargin = 0;
        // Adjust margin based on Y axis
        yAxis.selectAll("text").each(function() {
            if (this.getBBox().width > recommendedLeftMargin) { 
                recommendedLeftMargin = this.getBBox().width;
            }
        });

        this.margin["left"] = recommendedLeftMargin;

        this.setMargins();

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

        // Draw data points
        this.dataPoints = this.svg.selectAll("circle")
                                  .data(this.data)
                                  .join("circle")
                                  .attr("cx", d => x(d.coefficients))
                                  .attr("cy", d => y(d.features))
                                  .attr("data-bs-toggle", "popover")
                                  .attr("data-bs-placement", "left")
                                  .attr("data-bs-title", d => d.features)
                                  .attr("data-bs-content", d => d3.format(".4r")(d.coefficients))
                                  .attr("data-bs-trigger", "hover");

        this.applyDefaultStyling();

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

        this.enablePopovers();
    }

    enablePopovers() {
        const popoverTriggerList = document.querySelectorAll('[data-bs-toggle="popover"]');
        const popoverList = [...popoverTriggerList].map(popoverTriggerEl => new bootstrap.Popover(popoverTriggerEl));
    }

    applyDefaultStyling() {
        this.dataPoints.attr("r", "4")
                       // I mimick the R studio colour scheme
                       .style("fill", d => d.coefficients < 0 ? "#F8766D" : "#00BFC4")
                       .style("opacity", 0.8)
                       .style("stroke", "grey")
                       .on("mouseover", (event, row) => {
                           let pointElement = d3.select(event.target);
                           this.mouseOverPoint(row, pointElement);
                       })
                       .on("mouseout", () => { this.mouseOut(); });
    }

    mouseOverPoint(row, pointElement) {
        pointElement.attr("r", "6")
                    .style("opacity", 1);
    }

    mouseOut() {
        this.applyDefaultStyling();
    }
}