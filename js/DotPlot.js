class DotPlot {
    constructor(targetElementName, data, onUpdateSelection, margin={ top: 30,
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

        this._filterValue = 0;
        this._textFilterValue = 0;

        // Compute the signs for each data point
        this.signGroups = [ "Negative coefficients", "Positive coefficients", "Removed coefficients", "Filtered coefficients" ];
        this.computeSignColumn();

        // Compute the probability value for each data point
        this.coefficients.forEach(row => {
            row["_prob"] = Helpers.logit2prob(row["coefficient"]);
        });

        // Store the absolute value of each coefficient for each data point
        this.coefficients.forEach(row => {
            row["coefficient_abs"] = Math.abs(row["coefficient"]);
        });

        // Compute minimum and maximum values
        this.coefficientValues = this.coefficients.map(row => +row.coefficient);
        this.minimumValue = +Math.min(...this.coefficientValues);
        this.maximumValue = +Math.max(...this.coefficientValues);
        this.coefficientsNo = this.coefficientValues.length;

        this._externalColumn = null;
        this._groupColumn = "_sign";

        // The X column for when the external column is collapsed
        this.externalColumnX = null;

        // Show guidelines?
        this._showGuidelines = true;

        // Show removed zero coefficients?
        this._showZeroCoefficients = true;

        // Use gradient?
        this._useGradient = false;

        // Convert coefficients to probabilities
        this._probabilityMode = false;
        this._useGradient = false;

        // Wha tshould we base our clusters on?
        this._clusterColumn = null;

        this.colorPalette = null;

        this._currentChartMode = ChartModes.DotPlot;

        // What column to use for sizing?
        this._sizeColumn = null;

        // What column to use for labels?
        this._textColumn = null;

        // Brushing active?
        this._brushActive = false;
        this.brush = null;

        this.selectedCoefficients = new ItemSelection(onUpdateSelection);

        this.initColorScale();

        this.originalWidth = parseInt(this.targetElement.style('width'), 10);
        this.initDimensions();
    }

    computeSignColumn() {
        this.coefficients.forEach(row => {
            if (row["coefficient"] == 0) {
                row["_sign"] = this.signGroups[2];
            }
            else if (row["coefficient_abs"] < this.filterValue) {
                row["_sign"] = this.signGroups[3];
            }
            else {
                row["_sign"] = row["coefficient"] < 0 ?
                               this.signGroups[0] :
                               this.signGroups[1];
            }
        });
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
        this.applyClusterGroupInfo();
        this.drawLegend();
        this.selectedCoefficients.callback();
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
    }

    // .currentChartMode
    get currentChartMode() {
        return this._currentChartMode;
    }

    set currentChartMode(chartMode) {
        this._currentChartMode = chartMode;

        console.log("Current chart mode changed. Updating plot");
        this.updatePlot();
    }

    // .showGuidelines
    get showGuidelines() {
        return this._showGuidelines;
    }

    set showGuidelines(showGuidelines) {
        this._showGuidelines = showGuidelines;

        this.applyLineVisibility();
    }

    // .showZeroCoefficients
    get showZeroCoefficients() {
        return this._showZeroCoefficients;
    }

    set showZeroCoefficients(showZeroCoefficients) {
        this._showZeroCoefficients = showZeroCoefficients;

        this.applyDefaultStyling();
        this.drawLabels();
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
            console.log("Colour palette changed. Updating plot");
            this.updatePlot();
        }
    }

    // .probabilityMode
    get probabilityMode() {
        return this._probabilityMode;
    }

    set probabilityMode(probabilityMode) {
        this._probabilityMode = probabilityMode;

        console.log("Probability mode changed. Updating plot");

        this.updatePlot();
    }

    // .sizeColumn
    get sizeColumn() {
        return this._sizeColumn;
    }

    set sizeColumn(sizeColumn) {
        this._sizeColumn = sizeColumn;

        console.log("Size column changed. Updating plot");

        this.initSizeScale();
        this.applyDefaultStyling();
        this.drawLegend();
    }

    // .textColumn
    get textColumn() {
        return this._textColumn;
    }

    set textColumn(textColumn) {
        this._textColumn = textColumn;

        console.log("Text column changed. Updating plot");

        this.drawLabels();
    }

    useDispersionMeasure(measure, field) {
        console.log("Computing dispersion measure");

        let stats = new Statistics({}, [], { "suppressWarnings": true });

        let filterValue = null;
        if (measure == DispersionMeasures.StandardDeviation) {
            filterValue = stats.standardDeviation(this.coefficientValues);
        } else if (measure == DispersionMeasures.InterquartileRange || 
                   measure == DispersionMeasures.InterquartileRangeNonZero) {
            let coefficientValues;
            if (measure == DispersionMeasures.InterquartileRange) {
                coefficientValues = this.coefficientValues;
            } else if (measure == DispersionMeasures.InterquartileRangeNonZero) {
                coefficientValues = this.coefficientValues.filter(coefficient => coefficient != 0);
            }

            filterValue = stats.interQuartileRange(coefficientValues);
        } else if (measure == DispersionMeasures.MedianAbsoluteDeviation) {
            filterValue = stats.medianAbsoluteDeviation(this.coefficientValues);
        }

        switch (field) {
            case "filter":
                this.filterValue = filterValue;
                break;
            case "text":
                this.textFilterValue = filterValue;
        }
    }

    // .clusterColumn
    get clusterColumn() {
        return this._clusterColumn;
    }

    set clusterColumn(clusterColumn) {
        // No updates if cluster column has remained the same
        if (clusterColumn == this.clusterColumn) {
            return;
        }

        this._clusterColumn = clusterColumn;

        this.drawClusters();
    }

    // .filterValue
    get filterValue() {
        return this._filterValue;
    }

    set filterValue(filterValue) {
        this._filterValue = filterValue;

        this.computeSignColumn();
        this.drawLabels();
        this.applyDefaultStyling();
        this.applyClusterGroupInfo();
        this.drawLegend();
        this.selectedCoefficients.callback();
    }

    // .textFilterValue
    get textFilterValue() {
        return this._textFilterValue;
    }

    set textFilterValue(textFilterValue) {
        this._textFilterValue = textFilterValue;

        this.drawLabels();
    }

    // .brushActive

    get brushActive() {
        return this._brushActive;
    }

    set brushActive(brushActive) {
        this._brushActive = brushActive;

        this.toggleBrush();
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

        // Compute frequencies
        if (this.groupColumn != null) {
            this.externalFrequencies = {};
            this.groups.forEach(group => {
                this.externalFrequencies[group] = 0;
            });

            this.coefficients.forEach(row => {
                this.externalFrequencies[row[this.groupColumn]]++;
            });
        }
    }

    initSizeScale() {
        let sizeValues = this.data.map(row => row[this.sizeColumn]).filter(value => value != "NA");

        this.sizeScale = d3.scaleLinear()
                           .domain(d3.extent(sizeValues))
                           .range(Constants.SizeScaleRange);
    }

    initExternal() {
        //this.data = Helpers.mergeVariables(this.data, this.external);
    }

    setMargins() {
        this.chartRangeWidth = this.width - this.margin.left - this.margin.right;

        this.svg.attr("transform", `translate(${this.margin.left}, ${this.margin.top})`);
    }

    drawPlot() {
        console.log("Draw call");

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
        let minimumXvalue = null;
        let maximumXvalue = null;
        let xValues;
        let customXvalues = false;

        if (this.externalColumnX == null) {
            // Show coefficients as logits
            if (!this.probabilityMode) {
                minimumXvalue = this.minimumValue;
                maximumXvalue = this.maximumValue;
            // Show coefficients as probabilities            
            } else {
                xValues = this.data.map(row => row["_prob"]);
                customXvalues = true;
            }
            
        } else {
            xValues = this.data.map(row => row[this.externalColumnX]).filter(value => value != "NA");
            customXvalues = true;
        }

        if (customXvalues) {
            minimumXvalue = Math.min(...xValues);
            maximumXvalue = Math.max(...xValues);
        }
        
        let x = d3.scaleLinear()
                  .domain([ minimumXvalue, maximumXvalue ])
                  .range([ 0, this.chartRangeWidth ]);

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

        // Draw clusters (before data points, so they appear below them)
        this.drawClusters();

        // Draw labels (before data points, so they appear below them)
        this.drawLabels();

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

        /*this.svg.selectAll("polygon")
            .data([poly])
          .enter().append("polygon")
            .attr("points", (d) => { 
                return d.map((d) => {
                    return [this.x(d[0]), this.y(d[1])].join(",");
                }).join(" ");
            })
            .attr("stroke","black")
            .attr("stroke-width",2);*/

        // Add zero reference
        let lineLayer = this.svg.append("g") // create another SVG group
                                .attr("transform", "translate(0, 0)");

        this.lineX = lineLayer.append("line")
                              .attr("id", "baseline")
                              .attr("x1", !this.probabilityMode || this.externalColumnX != null ? this.x(0) : this.x(0.5))  
                              .attr("y1", 0)
                              .attr("x2", !this.probabilityMode || this.externalColumnX != null ? this.x(0) : this.x(0.5))
                              .attr("y2", this.chartRangeHeight)
                              .style("stroke-width", 2)
                              .attr("stroke-dasharray", "8,8")
                              .style("stroke", "#a6a6a6")
                              .style("fill", "none")
                              .style("pointer-events", "none");

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
                              .style("pointer-events", "none");

        this.applyLineVisibility();
        this.drawLegend();
        this.drawStatistics();
        this.drawRegressionInfo();
        this.toggleBrush();
        this.selectedCoefficients.callback();

        this.originalX = this.x;
        this.originalY = this.y;
    }

    drawClusters() {
        // Always remove all clusters first. In case clustering is set to none
        this.pointPlane.selectAll(".teamHull").remove();
        this.pointPlane.selectAll(".teamHullHidden").remove();

        if (this.clusterColumn != null && this.clusterColumn != "_none") {
            this.clusters = Helpers.uniqueValues(this.data, this.clusterColumn).filter(cluster => cluster != "NA").sort();
            let clusterColorScale = d3.scaleOrdinal().domain(this.clusters).range(Constants.ClusterPalette);
            let clusterColorFillScale = d3.scaleOrdinal().domain(this.clusters).range(Constants.ClusterPaletteFill);

            let points = this.clusters.map(d => []);
            let clusterCoefficients = this.clusters.map(d => []);

            this.coefficients.forEach(row => {
                let cluster = row[this.clusterColumn];
                let clusterIndex = this.clusters.indexOf(cluster);

                // If cluster is NA, skip
                if (clusterIndex < 0) {
                    return;
                }

                // Add the coordinates for this point to the cluster total
                points[clusterIndex].push([ row[this.externalColumnX], row[this.externalColumn] ]);

                // Add the coefficients of this point to the cluster total
                clusterCoefficients[clusterIndex].push(row["coefficient"]);
            });

            // Compute the means of each cluster
            this.clusterMeans = clusterCoefficients.map(coefficients =>
                coefficients.reduce((a,c) => a + c, 0) / coefficients.length);
    
            // Polygon
            let hull = points.map(d => d3.polygonHull(d));

            let teamArea = this.pointPlane.selectAll(".teamHull").data(points);
                
                teamArea.exit().remove();
                teamArea.enter().append("path")
                  .attr("class", "teamHull")
                  .attr("d", (points) => this.scalePath(points))
                  .attr("fill", "transparent")
                  //.attr("fill", (di, i) => clusterColorFillScale(this.clusters[i]))
                  .attr("stroke", (d, i) => clusterColorScale(this.clusters[i]))
                  .attr("stroke-width", "2")
                  .attr("stroke-dashoffset", "120px")
                  .attr("stroke-location", "outside")
                  .style("pointer-events", "none");

            let teamHiddenArea = this.pointPlane.selectAll(".teamHullHidden").data(points);
            teamHiddenArea.exit().remove();
            teamHiddenArea.enter().append("path")
                                                .attr("class", "teamHullHidden")
                                                .attr("d", (points) => this.scalePath(points))
                                                .attr("fill", "transparent")
                                                .attr("stroke", "transparent")
                                                .attr("stroke-width", "8")
                  .style("pointer-events", "stroke")
                  .style("cursor", "help")
                  .attr("data-bs-toggle", "popover")
                  .attr("data-bs-placement", "right")
                  .attr("data-bs-html", "true")
                  .attr("data-bs-title", (d, i) => this.clusters[i])
                  .attr("data-bs-trigger", "hover")
                  .on("mouseover", (event) => showPopover(event.target));

            this.applyClusterGroupInfo();
        }
    }

    applyClusterGroupInfo() {
        if (this.clusterColumn == null || this.clusterColumn == "_none") {
            return;
        }

        let clusterGroupInformation = this.clusters.map(d => {
                let groupInformation = {};
                this.groups.forEach(group => {
                    groupInformation[group] = 0;
                });

                return groupInformation;
            });

        this.coefficients.forEach(row => {
            let cluster = row[this.clusterColumn];
            let clusterIndex = this.clusters.indexOf(cluster);

            // If cluster is NA, skip
            if (clusterIndex < 0) {
                return;
            }

            // Add group count to cluster total
            let group = row[this.groupColumn];
            clusterGroupInformation[clusterIndex][group] += 1;
        });

        this.pointPlane.selectAll(".teamHullHidden")
                       .attr("data-bs-content", (d, i) => {
                    let base = `mean coefficient:  ${d3.format(".4r")(this.clusterMeans[i])}<br>`;

                    base += '<div class="tally pt-2">';

                    this.groups.forEach(group => {
                        let colour = this.colorScale(group);
                        base += `<div class='text-center'>
                                 <div class="tipdot" style="background-color: ${colour};"></div>
                                 <div>${clusterGroupInformation[i][group]}</div>
                                </div>`;
                    })
                    base += '</div>';

                    return base;
                   });
    }

    drawLabels() {
        this.pointPlane.selectAll(".label").remove();

        if (this.textColumn == null || this.textColumn == "_none") 
        {
            return;
        }

        this.labels = this.pointPlane.selectAll(".label")
                                  .data(this.data)
                                  .enter()
                                  .append("text")
                                  .attr("class", "label")
                                  .attr("x", d => this.scaleX(d) + 10)
                                  .attr("y", d => this.scaleY(d) + 10)
                                  .style("visibility", d => this.computeVisibility(d, true))
                                  .style("fill", d => this.colorScale(d[this.groupColumn]))
                                  .text(d => d[this.textColumn]);
    }

    scaleX(d) {
        // Coefficient as logit
        if (this.externalColumnX == null) {
            if (!this.probabilityMode) {
                return this.x(d.coefficient);
            // Coefficient as probability
            } else {
                return this.x(d["_prob"]);
            }
        // External value
        } else {
            return this.x(d[this.externalColumnX]);
        }
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

    scalePath(points) {
        if (points.length <= 1) {
            return null;
        }

        // Scale points
        // We have to get the original values into the .data thing because we need them for zooming
        points = points.map(coordinates => [ this.x(coordinates[0]),
                                             this.y(coordinates[1]) ]);

        // Check what points we really need
        let hull = d3.polygonHull(points);

        // Turn them into a path
        let path = "M" + hull.join("L") + "Z";

        return path;
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

        this.scatter.selectAll(".label")
                    .attr('x', d => this.scaleX(d) + 10)
                    .attr('y', d => this.scaleY(d) + 10);

        this.scatter.selectAll(".teamHull")
                    .attr("d", (points) => this.scalePath(points));

        this.scatter.selectAll(".teamHullHidden")
                    .attr("d", (points) => this.scalePath(points));

        this.lineX.attr("x1", this.x(0)) 
                  .attr("x2", this.x(0))

        this.lineY.attr("y1", this.y(0)) 
                  .attr("y2", this.y(0))
    }

    toggleBrush() {
        if (this.brushActive) {
            this.applyBrush();
        } else {
            this.destroyBrush();
        }
    }

    applyBrush() {
        this.brush = d3.brush()
            .extent([[0, 0], [this.chartRangeWidth, this.   chartRangeHeight]])
            .on("brush", (event) => { this.onBrush(event); })
            .on("end", (event) => { this.selectedCoefficients.callback(); /* callback only on brush end */ });
        this.brushArea = this.svg.append("g")
            .attr("class", "brush")
            .call(this.brush);

    }

    destroyBrush() {
        this.svg.select(".brush").remove();
    }
    
    cancelBrush() {
        this.brushArea.call(this.brush.move, null);
    }

    onBrush(event) {
        const extent = event.selection;

        if (extent == null) {
			return;
		}

        this.selectedCoefficients.clear(false);

        this.dataPoints.classed("selected", (d, i, dataPoints) => {
            const el = d3.select(dataPoints[i]);
            const selected = extent[0][0] <= el.attr("cx") && extent[1][0] >= el.attr("cx") && extent[0][1] <= el.attr("cy") && extent[1][1] >= el.attr("cy");

            if (selected) {
                this.selectedCoefficients.add(d["feature"], false);
            }

            return selected;
        });
                       
    }

    manualClearSelection() {
        this.selectedCoefficients.clear();
        this.applyDefaultStyling();
    }

    computeSizing(d) {
        if (this.sizeColumn == null || this.sizeColumn == "_none") {
            return Constants.SizeScaleRange[0];
        }

        return this.sizeScale(d[this.sizeColumn]);
    }

    computeColor(d) {
        if (this.useGradient) {
            return this.gradientColorScale(d[this.groupColumn]);
        } else {
            return this.colorScale(d[this.groupColumn]);
        }
    }

    computeVisibility(d, label=false) {
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

        if (label && d["coefficient_abs"] < this.textFilterValue) {
            return "hidden";
        }

        return "visible";
    }

    applyDefaultStyling() {
        this.dataPoints.attr("r", d => this.computeSizing(d))
                       .attr("data-bs-content", d => {
                            let pValue =d3.format(".4r")(d["_prob"]);
                            let coefficient = d3.format(".4r")(d.coefficient);

                            let base = `coefficient: <i>${coefficient}</i><br>`;
                                base += `probability: <i>${pValue}</i>`;

                            if (this.currentChartMode == ChartModes.ScatterPlot && this.externalColumnX == null) {
                                let externalValue = d3.format(".4r")(d[this.externalColumn]);
                                base += `<br>${this.externalColumn}: <i>${externalValue}</i>`;
                            }

                            if (this.useGradient) {
                                let groupValue = d3.format(".4r")(d[this.groupColumn]);
                                base += `<br>${this.groupColumn}: <i>${groupValue}</i>`;
                            }

                            return base;
                        })
                       .attr("feature", d => d["feature"])
                       // I mimick the R studio colour scheme
                       .style("fill", d => this.computeColor(d))
                       .style("fill-opacity", 0.5)
                       .style("visibility", d => this.computeVisibility(d))
                       .classed("selected", (d, i) => this.selectedCoefficients.items.includes(d["feature"]))
                       .on("click", (event, row) => {
                            let pointElement = d3.select(event.target);
                            this.clickPoint(row, pointElement);
                       })
                       .on("mouseover", (event, row) => {
                           let pointElement = d3.select(event.target);
                           this.mouseOverPoint(row, pointElement);
                       })
                       .on("mouseout", (event, row) => { 
                           let pointElement = d3.select(event.target);
                           this.mouseOut(row, pointElement);
                        });
    }

    applyLineVisibility() {
        this.lineX.style("visibility", this.showGuidelines ? "visible" : "hidden");
        this.lineY.style("visibility", this.showGuidelines && this.zoomAllowed ?
                                       "visible" : "hidden");
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

    clickPoint(row, pointElement) {
        let isAlreadySelected = this.selectedCoefficients.items.includes(row["feature"]);
        pointElement.classed("selected", !isAlreadySelected);
        this.selectedCoefficients.toggle(row["feature"]);
    }

    mouseOverPoint(row, pointElement, popover=true) {
        if (popover) {
            showPopover(pointElement.node());
        }
        pointElement.style("filter", `drop-shadow(0px 0px 4px ${this.computeColor(row)})`);
    }

    mouseOut(row, pointElement) {
        pointElement.style("filter", null);
    }

    drawLegendCircle(cx, cy, group, index, className) {
        this.svg.append("circle")
        .attr("cx", cx)
        .attr("cy", cy)
        .attr("r", 6)
        .attr("fill-opacity", 0.6)
        .attr("class", className)
        .style("fill", () => {
            if (index <= 1 && this.useGradient) {
                return this.getColorPalette(true)[index];
            }

            return(this.colorScale(group));
        })
        .style("stroke", "grey")
    }

    drawLegend() {
        // Remove pre-existing legend things
        this.svg.selectAll(".legend_piece").remove();

        // Handmade legend
        this.groups.forEach((group, index) => {
            if (this.useGradient && index > 1) {
                return;
            }

            this.drawLegendCircle(this.chartRangeWidth - 60, 30 * (index + 1), group, index, "legend_piece");
            
            let text = group;

            this.svg.append("text")
                    .attr("x", this.chartRangeWidth - 75)
                    .attr("y", 30 * (index + 1))
                    .text(text)
                    .style("font-size", "15px")
                    .attr("class", "legend_piece")
                    .attr("alignment-baseline","middle")
                    .attr("text-anchor", "end")

            const frequencyPercent = this.externalFrequencies[group] / this.coefficientsNo;
            const frequencyInfo = `${this.externalFrequencies[group]} / ${d3.format(".0%")(frequencyPercent)}`;

            this.svg.append("text")
                    .attr("x", this.chartRangeWidth - 45)
                    .attr("y", 30 * (index + 1))
                    .text(frequencyInfo)
                    .style("font-size", "15px")
                    .attr("class", "legend_piece")
                    .attr("alignment-baseline","middle")
                    .attr("text-anchor", "start")
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

    generateRegressionPopoverData(axis, regressionColumns) {
        return `coeff: ${this.data[0][regressionColumns["coefficient"][axis]]}<br>
                sig: ${this.data[0][regressionColumns["significance"][axis]]}`
    }

    drawRegressionInfo() {
        // Remove pre-existing regression things
        this.svg.selectAll(".regression").remove();

        if (!(this.currentChartMode == ChartModes.ScatterPlot && this.externalColumnX != null)) {
            return;
        }

        // Define all necessary columns
        let regressionColumns = { "coefficient": { "x": `${this.externalColumnX}_coeff`,
                                                   "y": `${this.externalColumn}_coeff` },
                                  "significance": { "x": `${this.externalColumnX}_sig`,
                                                    "y": `${this.externalColumn}_sig` } };

        // Check whether all columns are present
        let missingData = false;
        for (let columnType in regressionColumns) {
            for (let axis in regressionColumns[columnType]) {
                if (!(this.data.columns.includes(regressionColumns[columnType][axis]))) {
                    missingData = true;
                    break
                }
            }
        }

        if (missingData) {
            return;
        }

        function generateCoefficientArrow(coefficient){
            return coefficient > 0 ? "↑" : "↓"
        }

        const formatFunction = d3.format(".2f");
        const xCoeffText = `x→ = p(    )${generateCoefficientArrow(this.data[0][regressionColumns["coefficient"]["x"]])}`;
        const yCoeffText = `y↑ = p(    )${generateCoefficientArrow(this.data[0][regressionColumns["coefficient"]["y"]])}`;

        this.svg.append("text")
                .attr("x", this.chartRangeWidth - 80)
                .attr("y", this.chartRangeHeight - 25)
                .text(xCoeffText)
                .style("font-size", "15px")
                .style("white-space", "pre")
                .style("user-select", "none")
                .attr("class", "statistics")
                .attr("alignment-baseline","middle")
                .attr("text-anchor", "left")
                .attr("data-bs-toggle", "popover")
                .attr("data-bs-placement", "right")
                .attr("data-bs-html", "true")
                .attr("data-bs-title", this.externalColumnX)
                .attr("data-bs-content", this.generateRegressionPopoverData("x", regressionColumns))
                .attr("data-bs-trigger", "hover")
                .on("mouseover", (event) => showPopover(event.target));

        this.drawLegendCircle(this.chartRangeWidth - 20.5, this.chartRangeHeight - 25, this.groups[1], 1, "regression");

        this.svg.append("text")
                .attr("x", 25)
                .attr("y", 30)
                .text(yCoeffText)
                .style("font-size", "15px")
                .style("white-space", "pre")
                .style("user-select", "none")
                .attr("class", "statistics")
                .attr("alignment-baseline","middle")
                .attr("text-anchor", "left")
                .attr("data-bs-toggle", "popover")
                .attr("data-bs-placement", "top")
                .attr("data-bs-html", "true")
                .attr("data-bs-title", this.externalColumn)
                .attr("data-bs-content", this.generateRegressionPopoverData("y", regressionColumns))
                .attr("data-bs-trigger", "hover")
                .on("mouseover", (event) => showPopover(event.target));

        this.drawLegendCircle(79.5, 29, this.groups[1], 1, "regression");
    }
}