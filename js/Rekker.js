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
        this.selectExternal2D = d3.select("#select_external_2D");
        this.selectCategoricalCoding = d3.select("#select_categorical_coding");
        this.selectNumericCoding = d3.select("#select_numeric_coding");
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
        document.getElementsByName("radio_color_coding").forEach(element => {
            element.onclick = () => { 
                if (element.id == ColorCodings.NumericCoding) {
                    this.updateNumericCodingColumn();
                    this.selectCategoricalCoding.attr("disabled", "");
                    this.selectNumericCoding.attr("disabled", null);
                    this.dotPlot.useGradient = true;
                } else {
                    this.updateCategoricalCodingColumn();
                    this.selectCategoricalCoding.attr("disabled", null);

                    // Reset the gradient manually
                    //this.usePositiveNegativeGradientCheckbox.node().checked = false;
                    this.dotPlot.useGradient = false;

                    this.selectNumericCoding.attr("disabled", "");
                }
            };
        });

        let externalVariables = [];
        if (this.dataSource.externalAvailable) {
            externalVariables = this.dataSource.numericColumnsCollapsed;
        } else {
            // todo should this go?
            document.getElementById("radio_view_external").disabled = true;
        }
        

        let externalVariables2D = [];
        if (this.dataSource.external2DAvailable) {
            externalVariables2D = this.dataSource.numericColumns2D;
        } else {
            // todo this should be adapted
            document.getElementById("radio_view_external").disabled = true;
        }
        
        this.selectExternal.selectAll("option")
                           .data(externalVariables)
                           .enter()
                           .append("option")
                           .attr("value", d => d)
                           .text(d => d);
        
        this.selectExternal2D.selectAll("option")
                           .data(externalVariables2D)
                           .enter()
                           .append("option")
                           .attr("value", d => d)
                           .text(d => d);

        this.selectNumericCoding.selectAll("option")
                                .data(["coefficient"].concat(externalVariables))
                                .enter()
                                .append("option")
                                .attr("value", d => d)
                                .text(d => d);

        this.selectExternal.on("change", () => { 
            this.updateExternalColumn();
        });

        this.selectExternal2D.on("change", () => { 
            this.updateExternal2DColumn();
        });

        this.showZeroCoefficientsCheckbox.on("change", () => {
            this.dotPlot.showZeroCoefficients = this.showZeroCoefficientsCheckbox.node().checked;
        })

        this.usePositiveNegativeGradientCheckbox.on("change", () => {
            this.dotPlot.useGradient = this.usePositiveNegativeGradientCheckbox.node().checked;
        })

        let codingVariables = [ "_sign" ];
        if (this.dataSource.codingAvailable) {
            codingVariables = codingVariables.concat(this.dataSource.stringColumns);
        }
        
        this.selectCategoricalCoding.selectAll("option")
                           .data(codingVariables)
                           .enter()
                           .append("option")
                           .attr("value", d => d)
                           .text(d => d == "_sign" ? "Positive/negative coefficient" : d);

        this.selectCategoricalCoding.on("change", () => { 
            this.updateCategoricalCodingColumn();
        });

        this.selectNumericCoding.on("change", () => { 
            this.updateNumericCodingColumn();
        });

        document.getElementsByName("radio_view").forEach(element => {
            element.onclick = () => { 
                let axisMode = element.id;
                let chartMode;

                if (axisMode == AxisModes.CoefficientsOnly) {
                    chartMode = ChartModes.DotPlot;

                    this.selectExternal.attr("disabled", "");
                    this.selectExternal2D.attr("disabled", "");
                    this.dotPlot.externalColumnX = null;
                } else {
                    chartMode = ChartModes.ScatterPlot;

                    if (axisMode == AxisModes.CoefficientsExternal) {
                        this.updateExternalColumn();
                        this.selectExternal.attr("disabled", null);
                        this.selectExternal2D.attr("disabled", "");   
                    } else if (axisMode == AxisModes.ExternalOnly) {
                        this.updateExternal2DColumn();
                        this.selectExternal2D.attr("disabled", null);
                        this.selectExternal.attr("disabled", "");   
                    }
                }

                this.dotPlot.currentChartMode = chartMode;
            };
        });
    }

    updateExternalColumn() {
        this.dotPlot.externalColumn = this.selectExternal.node().value;
    }

    updateExternal2DColumn() {
        this.dotPlot.externalColumn = `${this.selectExternal2D.node().value}²`;
    }

    updateCategoricalCodingColumn() {
        this.dotPlot.groupColumn = this.selectCategoricalCoding.node().value;
    }

    updateNumericCodingColumn() {
        this.dotPlot.groupColumn = this.selectNumericCoding.node().value;
    }
}