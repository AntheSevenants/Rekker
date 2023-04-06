class Histogram {
    constructor(dotPlot) {
        this.svg = dotPlot.svg;

        this.coefficients = dotPlot.coefficients;

        this.minimumValue = dotPlot.minimumValue;
        this.maximumValue = dotPlot.maximumValue;

        this.chartRangeWidth = dotPlot.chartRangeWidth;
        this.chartRangeHeight = dotPlot.chartRangeHeight;

        this.drawPlot();
    }

    drawPlot() {
        // X axis: scale and draw:
        this.scaleX = d3.scaleLinear()
            .domain([this.minimumValue, this.maximumValue])
            .range([0, this.chartRangeWidth]);

        this.svg.append("g")
            .attr("transform", `translate(0, ${this.chartRangeHeight})`)
            .call(d3.axisBottom(this.scaleX));

        // set the parameters for the histogram
        const histogram = d3.histogram()
            .value((d) => d["coefficient_adj"])   // I need to give the vector of value
            .domain(this.scaleX.domain())  // then the domain of the graphic
            .thresholds(this.scaleX.ticks(20)); // then the numbers of bins

        // And apply twice this function to data to get the bins.
        let bins1 = histogram(this.coefficients.filter(d => d.coefficient < 0));
        let bins2 = histogram(this.coefficients.filter(d => d.coefficient > 0));

        // Y axis: scale and draw:
        this.scaleY = d3.scaleLinear()
            .range([this.chartRangeHeight, 0]);

        this.scaleY.domain([0, d3.max(bins1, (d) => d.length)]);   // d3.hist has to be called before the Y axis obviously

        this.svg.append("g")
            .call(d3.axisLeft(this.scaleY));

        this.svg.append("g")
            .call(d3.axisLeft(this.scaleY));

        // append the bars for series 1
        this.svg.selectAll("rect")
            .data(bins1)
            .join("rect")
            .attr("x", 1)
            .attr("transform", d => `translate(${this.scaleX(d.x0)} , ${this.scaleY(d.length)})`)
            .attr("width", d => this.scaleX(d.x1) - this.scaleX(d.x0) - 1)
            .attr("height", d => this.chartRangeHeight - this.scaleY(d.length))
            .style("fill", "#69b3a2")
            .style("opacity", 0.6)

        // append the bars for series 2
        this.svg.selectAll("rect2")
            .data(bins2)
            .enter()
            .append("rect")
            .attr("x", 1)
            .attr("transform", d => `translate(${this.scaleX(d.x0)} , ${this.scaleY(d.length)})`)
            .attr("width", d => this.scaleX(d.x1) - this.scaleX(d.x0) - 1)
            .attr("height", d => this.chartRangeHeight - this.scaleY(d.length))
            .style("fill", "#404080")
            .style("opacity", 0.6)
    }
}