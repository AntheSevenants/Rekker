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

        // Use gradient?
        this._useGradient = false;

        this.colorPalette = null;

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

        this.enablePopovers();
    }

    // .externalColumn
    get externalColumn() {
        return this._externalColumn;
    }

    set externalColumn(column) {
        this._externalColumn = column;

        if (this._externalColumn == null) {
            return;
        }

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

        this.applyDefaultStyling();
    }

    // .useGradient
    get useGradient() {
        return this._useGradient;
    }

    set useGradient(gradientUsed) {
        this._useGradient = gradientUsed;

        this.initColorScale();
        this.applyDefaultStyling();
        this.drawLegend();
    }

    // .zoomAllowed
    get zoomAllowed() {
        return (this.currentChartMode == ChartModes.ScatterPlot && this.externalColumnX != null);
    }

    setColorPalette(colorPalette, update=true) {
        this.colorPalette = colorPalette;
        if (update) {
            this.updatePlot();
        }
    }

    getColorPalette(gradient) {
        if (this.colorPalette != null) {
            return this.colorPalette;
        } else {
            if (!gradient) {
                return Constants.ColorPalette;
            } else {
                return Constants.GradientPalette;
            }
        }
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
                this.targetElement.style("height", `${window.innerHeight - 50}px`);
                this.targetElement.style("width", `${window.innerHeight - 50}px`);
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

        // Hardcoded positive/negative groups
        if (this.groupColumn == "_sign") {
            this.groups = this.signGroups;
        // Numeric groups
        } else if (this.useGradient) {
            let groupValues = this.data.map(row => row[this.groupColumn]).filter(value => value != "NA");

            this.minimumGroupValue = +Math.min(...groupValues);
            this.maximumGroupValue = +Math.max(...groupValues);

            // Coefficient numeric group/
            if (this.groupColumn == "coefficient") {
                this.groups = this.signGroups;
            } else {
                this.groups = [ this.minimumGroupValue,this.maximumGroupValue ];
            }
        }
        // Categorical groups
        else {
            this.groups = Helpers.uniqueValues(this.coefficients, this.groupColumn).sort();
        }

        // We just want a categorical scale if we're not using the gradient scaling option
        this.colorScale = d3.scaleOrdinal().domain(this.groups).range(this.getColorPalette(false));

        if (this.useGradient) {
            this.gradientColorScale = d3.scaleLinear()
                                        .domain([ this.minimumGroupValue, this.maximumGroupValue ])
                                        .range(this.getColorPalette(true));
        }
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

        this.y = y;
        

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

        this.yAxis = yAxis;

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
        this.xAxis = this.svg.append("g")
                             .attr("transform", `translate(0, ${this.chartRangeHeight})`)
                             .call(d3.axisBottom(x));

        this.pointPlane = this.svg;

        this.x = x;

        if (this.zoomAllowed) {
            this.clipMargin = 4;
    
            // Clip path: everything OUTSIDE of this area won't be drawn
            // (modified from the D3 Graph Gallery)
            this.clip = this.svg.append("defs")
                                .append("SVG:clipPath")
                                .attr("id", "clip")
                                .append("SVG:rect")
                                .attr("width", this.chartRangeWidth + this.clipMargin * 2)
                                .attr("height", this.chartRangeHeight + this.clipMargin * 2)
                                .attr("x", -this.clipMargin)
                                .attr("y", -this.clipMargin);

            // Scatter variable: both circles and the brush take place here
            this.scatter = this.svg.append("g")
                                   .attr("clip-path", "url(#clip)");

            this.zoom = d3.zoom()
                      .scaleExtent([.5, 16])
                      .extent([ [0, 0], [this.chartRangeWidth, this.chartRangeHeight] ])
                      .on("zoom", (event) => { this.updateChart(event); });

            this.pointPlane = this.scatter;
        }

        this.coordinates = {};
        this.data.forEach(d => {
            this.coordinates[d.feature] = {
                "x": Helpers.round(this.scaleX(d), 3),
                "y":  Helpers.round(this.scaleY(d), 3)
            };
        });

        // Now, let's only look at the coordinate values
        let coordinateValues = Object.values(this.coordinates);

        // We compute the unique coordinates, 
        // so we can check below which coordinate pairs are duplicates
        let uniqueCoordinates = coordinateValues.filter(
            (pair, index) => index === coordinateValues.findIndex(
                other => pair.x === other.x && 
                        pair.y === other.y
        ));

        // Converting to a set removes duplicates (or so they say)
        uniqueCoordinates = new Set(uniqueCoordinates);

        // Now, let's find the duplicates by checking set membership
        this.duplicates = coordinateValues.filter(item => {
            if (uniqueCoordinates.has(item)) {
                uniqueCoordinates.delete(item);
            } else {
                return item;
            }
        });

        // We group all duplicates by coordinate
        // This way, we know which features belong to a specific coordinate
        this.duplicatesCollection = {};
        for (let feature in this.coordinates) {
            let coordinates = this.coordinates[feature];

            for (let j = 0; j < this.duplicates.length; j++) {
                let duplicate = this.duplicates[j];
                if (coordinates.x == duplicate.x && 
                        coordinates.y == duplicate.y) {
                    let key = Helpers.coords2key(duplicate);
                    if (key in this.duplicatesCollection) {
                        this.duplicatesCollection[key].features.push(feature)
                    } else {
                        this.duplicatesCollection[key] = {
                            "x": duplicate.x,
                            "y": duplicate.y,
                            "features": [ feature ]
                        };
                    }

                    break;
                }
            }
        }

        // Draw data points
        this.dataPoints = this.pointPlane.selectAll("circle")
                                  .data(this.data)
                                  .join("circle")
                                  .attr("cx", d => this.coordinates[d.feature]["x"])
                                  .attr("cy", d => this.coordinates[d.feature]["y"])
                                  .style("stroke", "grey")
                                  .attr("data-bs-toggle", "popover")
                                  .attr("data-bs-placement", "left")
                                  .attr("data-bs-html", "true")
                                  .attr("data-bs-title", d => d.feature)
                                  .attr("data-bs-trigger", "hover");        

        if (this.zoomAllowed) {
            // This add an invisible rect on top of the chart area. 
            // This rect can recover pointer events: necessary to understand when the user zooms
            this.svg.append("rect")
                    .attr("width", this.chartRangeWidth)
                    .attr("height", this.chartRangeHeight)
                    .attr("class", "dragplane")
                    .style("fill", "none")
                    .style("pointer-events", "all")
                    //.attr("transform", `translate(${this.margin.left}, ${this.margin.top})`)
                    .lower()
                    .call(this.zoom);
            // now the user can zoom and it will trigger the function called updateChart
        }

        this.handleDuplicates();
        this.applyDefaultStyling();

        // Add zero reference
        let lineLayer = this.svg.append("g") // create another SVG group
                                .attr("transform", "translate(0, 0)");

        this.lineX = lineLayer.append("line")
                              .attr("id", "baseline")
                              .attr("x1", this.x(0))  
                              .attr("y1", 0)
                              .attr("x2", this.x(0))
                              .attr("y2", this.chartRangeHeight)
                              .style("stroke-width", 2)
                              .attr("stroke-dasharray", "8,8")
                              .style("stroke", "#a6a6a6")
                              .style("fill", "none");

        this.lineY = lineLayer.append("line")
                              .attr("id", "baseline-y")
                              .attr("x1", 0)
                              .attr("y1", this.y(0))
                              .attr("x2", this.chartRangeWidth)
                              .attr("y2", this.y(0))
                              .style("stroke-width", 2)
                              .attr("stroke-dasharray", "8,8")
                              .style("stroke", "#a6a6a6")
                              .style("fill", "none")
                              .style("visibility", !this.zoomAllowed ? "hidden" : "visible");

        this.drawLegend();
        this.drawStatistics();

        this.originalX = this.x;
        this.originalY = this.y;
    }

    scaleX(d) {
        return this.externalColumnX == null ?
               this.x(d.coefficient) :
               this.x(d[this.externalColumnX]);
    }

    scaleY(d) {
         switch(this.currentChartMode) {
            case ChartModes.DotPlot:
                return this.y(d.feature);
                break;
            case ChartModes.ScatterPlot:
                return this.externalColumn != "NA" ?
                       this.y(d[this.externalColumn]) :
                       0;
                break;
        }
    }

    // A function that updates the chart when the user zooms and thus new boundaries are available
    updateChart(event) {
        // recover the new scale
        this.x = event.transform.rescaleX(this.originalX);
        this.y = event.transform.rescaleY(this.originalY);
    
        // update axes with these new boundaries
        this.xAxis.call(d3.axisBottom(this.x))
        this.yAxis.call(d3.axisLeft(this.y))

        this.scatter.selectAll("circle")
                    .attr('cx', d => this.scaleX(d))
                    .attr('cy', d => this.scaleY(d));

        this.lineX.attr("x1", this.x(0)) 
                  .attr("x2", this.x(0))

        this.lineY.attr("y1", this.y(0)) 
                  .attr("y2", this.y(0))
    }

    enablePopovers() {
        const popoverTriggerList = document.querySelectorAll('[data-bs-toggle="popover"]');
        const popoverList = [...popoverTriggerList].map(popoverTriggerEl => new bootstrap.Popover(popoverTriggerEl));
    }

    applyDefaultStyling() {
        this.dataPoints.attr("r", "4")
                       .attr("data-bs-content", d => {
                            let base = d3.format(".4r")(d.coefficient);

                            if (this.currentChartMode == ChartModes.ScatterPlot && this.externalColumnX == null) {
                                let externalValue = d3.format(".4r")(d[this.externalColumn]);

                                base = `coefficient: <i>${base}</i><br>`;
                                base += `${this.externalColumn}: <i>${externalValue}</i>`;
                            }

                            if (this.useGradient) {
                                let groupValue = d3.format(".4r")(d[this.groupColumn]);
                                base += `<br>${this.groupColumn}: <i>${groupValue}</i>`;
                            }

                            return base;
                        })
                       // I mimick the R studio colour scheme
                       .style("fill", d => { 
                            if (this.useGradient) {
                                return this.gradientColorScale(d[this.groupColumn]);
                            } else {
                                return this.colorScale(d[this.groupColumn]); }
                            }
                        )
                       .style("opacity", 0.8)
                       .style("visibility", (d) => { 
                            if (d.coefficient == 0) {
                                if (!this.showZeroCoefficients) {
                                    return "hidden";
                                }
                            }

                            if (this.externalColumn != null) {
                                if (d[this.externalColumn] == "NA") {
                                    return "hidden";
                                }
                            }

                            return "visible";
                        })
                       .on("mouseover", (event, row) => {
                           let pointElement = d3.select(event.target);
                           this.mouseOverPoint(row, pointElement);
                       })
                       .on("mouseout", (event, row) => { 
                           let pointElement = d3.select(event.target);
                           this.mouseOut(row, pointElement);
                        });

        this.enablePopovers();
    }

    handleDuplicates() {
        // Now, let's go after duplicates
        for (let key in this.duplicatesCollection) {
            // We check all duplicate groupings
            let duplicatesCollection = this.duplicatesCollection[key];

            // The first feature becomes the "primary" feature of data point
            let primaryFeature = duplicatesCollection.features[0];
            // We use this point in the point cloud as a basis for our tooltip
            let primaryDataPoint = d3.select(`circle[data-bs-title='${primaryFeature}']`);
            
            // We get a list of all other features which are assumed under this data point
            let secondaryFeatures = duplicatesCollection.features.slice(1);

            // Compute the title of the primary data point as all features with this coordinate
            let tooltipTitle = `(${duplicatesCollection.features.length}) ` +
                               `${duplicatesCollection.features.sort().join(", ")}`;

            // Set the title and make the contours red
            primaryDataPoint.attr("data-bs-title", tooltipTitle)
                            .style("stroke-width", "2")
                            .style("stroke", "red");

            // And hide all other data points under this point
            secondaryFeatures.forEach(secondaryFeature => {
                let secondaryDataPoint = d3.select(`circle[data-bs-title='${secondaryFeature}']`);
                secondaryDataPoint.style("display", "none");
            });
        }
    }

    mouseOverPoint(row, pointElement) {
        pointElement.attr("r", "6")
                    .style("opacity", 1);
    }

    mouseOut(row, pointElement) {
        pointElement.attr("r", "4")
                    .style("opacity", 0.8);
    }

    drawLegend() {
        // Remove pre-existing legend things
        this.svg.selectAll(".legend_piece").remove();

        // Handmade legend
        this.groups.forEach((group, index) => {
            if (this.useGradient && index > 1) {
                return;
            }

            this.svg.append("circle")
                    .attr("cx", this.chartRangeWidth - 10)
                    .attr("cy", 30 * (index + 1))
                    .attr("r", 6)
                    .attr("fill-opacity", 0.6)
                    .attr("class", "legend_piece")
                    .style("fill", () => {
                        if (index <= 1 && this.useGradient) {
                            return this.getColorPalette(true)[index];
                        }

                        return(this.colorScale(group));
                    })
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

    drawStatistics() {
        // Remove pre-existing statistics things
        this.svg.selectAll(".statistics").remove();

        if (!(this.currentChartMode == ChartModes.ScatterPlot && this.externalColumnX == null)) {
            return;
        }

        let variables = { "coefficient": "metric",
                          [this.externalColumn]: 'metric' };

        let data = this.data.map(d => ({ "coefficient": d.coefficient,
                                         [this.externalColumn]: d[this.externalColumn] }));
        data = data.filter(d => d.coefficient != 0 || d[this.externalColumn] != "NA");

        let stats = new Statistics(data, variables);
        let rho = stats.correlationCoefficient('coefficient', this.externalColumn);

        let text = `ρ = ${d3.format(".4r")(rho["correlationCoefficient"])}`;

        this.svg.append("text")
                .attr("x", 25)
                .attr("y", 30)
                .text(text)
                .style("font-size", "15px")
                .attr("class", "statistics")
                .attr("alignment-baseline","middle")
                .attr("text-anchor", "left")
    }
}