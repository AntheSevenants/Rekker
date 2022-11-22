class Rekker {
    constructor() {
        this.dotPlotElementName = "dotplot";

        this.dataSource = new DataSource();

        d3.select("#input_dataset").on("change", (event) => {
            let reader = new FileReader()
            reader.onload = () => {
                this.dataSource.setCoefficientsUrl(reader.result);
                this.load();
            }
            reader.readAsDataURL(event.target.files[0])
        })

        this.selectExternal = d3.select("#select_external");
        this.selectCoding = d3.select("#select_coding");
        this.showZeroCoefficientsCheckbox = d3.select("#checkbox_show_zero_coefficients");
        this.usePositiveNegativeGradientCheckbox = d3.select("#checkbox_positive_negative_gradient");

        d3.select("#button_load_sample").on("click", () => {
            this.dataSource.setCoefficientsUrl("coefficients.csv");
            this.load();
        });
    }

    load() {
        d3.select("#section_fileUpload").remove();
        this.dataSource.load().then(() => { this.execute(); });
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
        document.getElementsByName("radio_variable_encoding").forEach(element => {
            element.onclick = () => { 
                if (element.id == ColorCodings.PositiveNegative) {
                    this.dotPlot.groupColumn = "_sign";
                    this.selectCoding.attr("disabled", "");
                    this.usePositiveNegativeGradientCheckbox.attr("disabled", null);
                } else {
                    this.updateCodingColumn();
                    this.selectCoding.attr("disabled", null);

                    // Reset the gradient manually
                    this.usePositiveNegativeGradientCheckbox.node().checked = false;
                    this.dotPlot.useGradient = false;

                    this.usePositiveNegativeGradientCheckbox.attr("disabled", "");
                }
            };
        });

        let externalVariables = [];
        if (this.dataSource.externalAvailable) {
            externalVariables = this.dataSource.numericColumnsCollapsed;
        } else {
            document.getElementById("radio_view_external").disabled = true;
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

        this.showZeroCoefficientsCheckbox.on("change", () => {
            this.dotPlot.showZeroCoefficients = this.showZeroCoefficientsCheckbox.node().checked;
        })

        this.usePositiveNegativeGradientCheckbox.on("change", () => {
            this.dotPlot.useGradient = this.usePositiveNegativeGradientCheckbox.node().checked;
        })

        let codingVariables = [];
        if (this.dataSource.codingAvailable) {
            codingVariables = this.dataSource.stringColumns;
        } else {
            document.getElementById("radio_variable_encoding_group_coding").disabled = true;
        }
        
        this.selectCoding.selectAll("option")
                           .data(codingVariables)
                           .enter()
                           .append("option")
                           .attr("value", d => d)
                           .text(d => d);

        this.selectCoding.on("change", () => { 
            this.updateCodingColumn();
        });

        document.getElementsByName("radio_view").forEach(element => {
            element.onclick = () => { 
                this.updateExternalColumn();
                let chartMode = element.id;

                if (chartMode == ChartModes.ScatterPlot) {
                    this.selectExternal.attr("disabled", null);
                } else {
                    this.selectExternal.attr("disabled", "");
                    this.dotPlot.externalColumnX = null;
                }
                
                this.dotPlot.currentChartMode = chartMode;
            };
        });
    }

    updateExternalColumn() {
        this.dotPlot.externalColumn = this.selectExternal.node().value;
    }

    updateCodingColumn() {
        this.dotPlot.groupColumn = this.selectCoding.node().value;
    }
}