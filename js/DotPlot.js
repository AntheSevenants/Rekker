class DotPlot {
    constructor(targetElementName, data, margin={ top: 0,
                                                  right: 30,
                                                  bottom: 30,
                                                  left: 50 }) {
        // Find the target element in the DOM
        this.targetElement = d3.select(`#${targetElementName}`);
        // Clear the element contents
        this.clear();

        // Save the margins for later
        this.margin = margin;

        // Save the data
        this.coefficients = data["coefficients"];
        this.coding = data["coding"];

        // Set element height depending on how many data points there are
        this.targetElement.style("height", `${this.coefficients.length * 10}px`);

        // Compute the width and height of our container
        this.width = parseInt(this.targetElement.style('width'), 10)
        this.height = parseInt(this.targetElement.style('height'), 10)

        this.chartRangeHeight = this.height - this.margin.top - this.margin.bottom;

        // Compute minimum and maximum values
        this.coefficientValues = this.coefficients.map(row => row.coefficients);
        this.minimumValue = +Math.min(...this.coefficientValues);
        this.maximumValue = +Math.max(...this.coefficientValues);

        this._currentColorCoding = ColorCodings.PositiveNegative;

        this.initColorScale();
    }

    clear() {
        // Clear the element contents
        this.targetElement.html("");
    }

    get currentColorCoding() {
        return this._currentColorCoding;
    }

    set currentColorCoding(coding) {
        this._currentColorCoding = coding;
        this.initColorScale();
        this.applyDefaultStyling();
        this.drawLegend();
    }

    initPlot() {
        // Append the SVG to our target element
        this.svg = this.targetElement.append("svg")
                                     .attr("width", this.width)
                                     .attr("height", this.height)
                                     .append("g");
    }

    initColorScale() {
        let data;

        switch (this.currentColorCoding) {
            case ColorCodings.PositiveNegative:
                this.groups = [ "Negative coefficients", "Positive coefficients" ];
                this.data = Helpers.mergeVariables(this.coefficients,
                                                   this.coefficients.map(row => ({ "features": row["features"],
                                                                                   "group": row["coefficients"] < 0 ? 
                                                                                            this.groups[0] :
                                                                                            this.groups[1] })));
                break;
            case ColorCodings.GroupCoding:
                this.groups = Helpers.uniqueValues(this.coding, "group").sort();
                this.data = Helpers.mergeVariables(this.coefficients, this.coding);
                break;
        }

        console.log(this.groups);

        // Color scaler
        this.colorScale = d3.scaleOrdinal().domain(this.groups).range(Constants.ColorPalette);
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
        this.drawLegend();
    }

    enablePopovers() {
        const popoverTriggerList = document.querySelectorAll('[data-bs-toggle="popover"]');
        const popoverList = [...popoverTriggerList].map(popoverTriggerEl => new bootstrap.Popover(popoverTriggerEl));
    }

    applyDefaultStyling() {
        this.dataPoints.attr("r", "4")
                       // I mimick the R studio colour scheme
                       .style("fill", d => this.colorScale(d.group) )
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

    drawLegend() {
        // Remove pre-existing legend things
        this.svg.selectAll(".legend_piece").remove();

        // Handmade legend
        this.groups.forEach((group, index) => {
            this.svg.append("circle")
                    .attr("cx", this.chartRangeWidth - 10)
                    .attr("cy", 30 * (index + 1))
                    .attr("r", 6)
                    .attr("fill-opacity", 0.6)
                    .attr("class", "legend_piece")
                    .style("fill", this.colorScale(group))
                    .style("stroke", "grey")
            
            let text = group;

            this.svg.append("text")
                    .attr("x", this.chartRangeWidth - 25)
                    .attr("y", 30 * (index + 1))
                    .text(text)
                    .style("font-size", "15px")
                    .attr("class", "legend_piece")
                    .attr("alignment-baseline","middle")
                    .attr("text-anchor", "end")
        });
    }
}