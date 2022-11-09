class Rekker {
    constructor() {
        this.dotPlotElementName = "dotplot";

        this.dataSource = new DataSource();
        this.dataSource.load().then(() => { this.execute(); });

        this.selectExternal = d3.select("#select_external");
    }

    execute() {
        if (!this.dataSource.availableDatasets.includes("coefficients")) {
            let errorMessage = "An error occurred while loading the dataset. ";
            errorMessage += "Do you have <code>coefficients.csv</code> in the Rekker directory?";
        
            d3.select(`#${this.dotPlotElementName}`).html(errorMessage);

            return;
        }

        this.dotPlot = new DotPlot(this.dotPlotElementName, this.dataSource.datasets);
        this.dotPlot.initPlot();
        this.dotPlot.drawPlot();

        this.prepareInterface();
    }

    prepareInterface() {
        if (!this.dataSource.codingAvailable) {
            document.getElementById("radio_variable_encoding_group_coding").disabled = true;
        }

        document.getElementsByName("radio_variable_encoding").forEach(element => {
            element.onclick = () => { this.dotPlot.currentColorCoding = element.id; };
        });

        let externalVariables = [];
        if (this.dataSource.externalAvailable) {
            externalVariables = this.dataSource.numericColumns;
        }
        
        this.selectExternal.selectAll("option")
                           .data(externalVariables)
                           .enter()
                           .append("option")
                           .attr("value", d => d)
                           .text(d => d);

        this.selectExternal.on("change", () => { 
            this.updateExternalColumn();
        });

        document.getElementsByName("radio_view").forEach(element => {
            element.onclick = () => { 
                let chartMode = element.id;
                this.dotPlot.currentChartMode = chartMode;

                this.selectExternal.attr("disabled", chartMode == ChartModes.ScatterPlot ? null : "");
                this.updateExternalColumn();
            };
        });
    }

    updateExternalColumn() {
        this.dotPlot.externalColumn = this.selectExternal.node().value;
        console.log(this.dotPlot.externalColumn);
        this.dotPlot.updatePlot();
    }
}