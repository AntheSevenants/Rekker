class DotPlot {
    constructor(targetElementName, data, margin={ top: 30,
                                                  right: 30,
                                                  bottom: 30,
                                                  left: 50 }) {
        // Find the target element in the DOM
        this.targetElement = d3.select(`#${targetElementName}`);
        // Clear the element contents
        this.clear();
        // Make the element visible (should it not be visible)
        this.targetElement.classed("hidden", null);

        // Save the margins for later
        this.margin = margin;

        // Save the data
        this.coefficients = data["coefficients"];

        // Compute the signs for each data point
        this.signGroups = [ "Negative coefficients", "Positive coefficients", "Removed coefficients" ];
        this.coefficients.forEach(row => {
            if (row["coefficient"] == 0) {
                row["_sign"] = this.signGroups[2];
            }
            else {
                row["_sign"] = row["coefficient"] < 0 ?
                               this.signGroups[0] :
                               this.signGroups[1];
            }
        });

        // Compute minimum and maximum values
        this.coefficientValues = this.coefficients.map(row => +row.coefficient);
        this.minimumValue = +Math.min(...this.coefficientValues);
        this.maximumValue = +Math.max(...this.coefficientValues);

        this._externalColumn = null;
        this._groupColumn = "_sign";

        // The X column for when the external column is collapsed
        this.externalColumnX = null;

        // Show removed zero coefficients?
        this._showZeroCoefficients = true;

        this._currentChartMode = ChartModes.DotPlot;

        this.initColorScale();

        this.originalWidth = parseInt(this.targetElement.style('width'), 10);
        this.initDimensions();
    }

    clear() {
        // Clear the element contents
        this.targetElement.html("");
    }

    // .groupColumn
    get groupColumn() {
        return this._groupColumn;
    }

    set groupColumn(column) {
        this._groupColumn = column;
        this.initColorScale();
        this.applyDefaultStyling();
        this.drawLegend();
    }

    // .externalColumn
    get externalColumn() {
        return this._externalColumn;
    }

    set externalColumn(column) {
        this._externalColumn = column;

        // If the external column is 'collapsed' (= ends in ²),
        // we manually change the assignment to the base name + .y
        // We inform the draw function further down by setting the 
        // .externalColumnX field
        let baseColumnName = column.slice(0, -1);
        if (column.slice(-1) == "²") {
            this._externalColumn = `${baseColumnName}.y`;
            this.externalColumnX = `${baseColumnName}.x`;
        } else {
            this.externalColumnX = null;
        }

        this.updatePlot();
    }

    // .currentChartMode
    get currentChartMode() {
        return this._currentChartMode;
    }

    set currentChartMode(chartMode) {
        this._currentChartMode = chartMode;

        this.updatePlot();
    }

    // .showZeroCoefficients
    get showZeroCoefficients() {
        return this._showZeroCoefficients;
    }

    set showZeroCoefficients(showZeroCoefficients) {
        this._showZeroCoefficients = showZeroCoefficients;

        this.updatePlot();
    }

    updatePlot() {
        this.clear();
        this.initColorScale();
        this.initDimensions();
        this.initPlot();
        this.drawPlot();
    }

    initDimensions() {
        switch (this.currentChartMode) {
            case ChartModes.DotPlot:
                // Set element height depending on how many data points there are
                this.targetElement.style("height", `${this.coefficients.length * 10}px`);
                this.targetElement.style("width", `${this.originalWidth}px`);
                break;
            case ChartModes.ScatterPlot:
                this.targetElement.style("height", `${window.innerHeight - 200}px`);
                this.targetElement.style("width", `${window.innerHeight - 200}px`);
                break;
        }
        
        // Compute the width and height of our container
        this.width = parseInt(this.targetElement.style('width'), 10);
        this.height = parseInt(this.targetElement.style('height'), 10);
        
        this.chartRangeHeight = this.height - this.margin.top - this.margin.bottom;
    }

    initPlot() {
        // Append the SVG to our target element
        this.svg = this.targetElement.append("svg")
                                     .attr("width", this.width)
                                     .attr("height", this.height)
                                     .append("g");

        if (this.currentChartMode == ChartModes.ScatterPlot) {
            this.initExternal();
        }
    }

    initColorScale() {
        this.data = this.coefficients;

        if (this.groupColumn == "_sign") {
            this.groups = this.signGroups;
        } else {
            this.groups = Helpers.uniqueValues(this.coefficients, this.groupColumn).sort();
        }

        // Color scaler
        this.colorScale = d3.scaleOrdinal().domain(this.groups).range(Constants.ColorPalette);
    }

    initExternal() {
        //this.data = Helpers.mergeVariables(this.data, this.external);
    }

    setMargins() {
        this.chartRangeWidth = this.width - this.margin.left - this.margin.right;

        this.svg.attr("transform", `translate(${this.margin.left}, ${this.margin.top})`);
    }

    drawPlot() {
        /////////
        // Y axis
        /////////

        let y;
        switch (this.currentChartMode) {
            case ChartModes.DotPlot:
                // Y scaler
                y = d3.scaleBand()
                      .range([ 0, this.chartRangeHeight ])
                      .domain(this.data.map(row => row.feature))
                      .padding(1);
                break;
            case ChartModes.ScatterPlot:
                let yValues = this.data.map(row => row[this.externalColumn]).filter(value => value != "NA");
                y = d3.scaleLinear()
                      .domain([ Math.min(...yValues), Math.max(...yValues) ])
                      .range([ this.chartRangeHeight, 0]);
                break;
        }
        

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

        this.margin["left"] = recommendedLeftMargin + 10;

        this.setMargins();

        /////////
        // X axis
        /////////

        // X scaler
        let x;

        if (this.externalColumnX == null) {
            x = d3.scaleLinear()
                  .domain([ this.minimumValue, this.maximumValue ])
                  .range([ 0, this.chartRangeWidth ]);
        } else {
            let xValues = this.data.map(row => row[this.externalColumnX]).filter(value => value != "NA");
            x = d3.scaleLinear()
                  .domain([ Math.min(...xValues), Math.max(...xValues) ])
                  .range([ 0, this.chartRangeWidth ]);
        }

        // X axis
        this.svg.append("g")
                .attr("transform", `translate(0, ${this.chartRangeHeight})`)
                .call(d3.axisBottom(x));

        // Draw data points
        this.dataPoints = this.svg.selectAll("circle")
                                  .data(this.data)
                                  .join("circle")
                                  .attr("cx", d => this.externalColumnX == null ?
                                                   x(d.coefficient) :
                                                   x(d[this.externalColumnX]))
                                  .attr("data-bs-toggle", "popover")
                                  .attr("data-bs-placement", "left")
                                  .attr("data-bs-title", d => d.feature)
                                  .attr("data-bs-content", d => d3.format(".4r")(d.coefficient))
                                  .attr("data-bs-trigger", "hover");

        switch(this.currentChartMode) {
            case ChartModes.DotPlot:
                this.dataPoints.attr("cy", d => y(d.feature));
                break;
            case ChartModes.ScatterPlot:
                this.dataPoints.attr("cy", d => this.externalColumn != "NA" ?
                                           y(d[this.externalColumn]) :
                                           0);
                break;
        }

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
                       .style("fill", d => this.colorScale(d[this.groupColumn]) )
                       .style("opacity", 0.8)
                       .style("visibility", (d) => { 
                            if (d.coefficient == 0) {
                                if (!this.showZeroCoefficients) {
                                    return "hidden";
                                }
                            }

                            return "visible";
                        })
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