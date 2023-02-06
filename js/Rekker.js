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
        this.selectClustering = d3.select("#select_clustering");
        this.selectCategoricalCoding = d3.select("#select_categorical_coding");
        this.selectNumericCoding = d3.select("#select_numeric_coding");
        this.selectSizeCoding = d3.select("#select_size_coding");
        this.selectTextCoding = d3.select("#select_text_coding");
        this.inputPullEffect = d3.select("#input_pull_effect");
        this.formPullEffect = d3.select("#form_pull_effect");
        this.pullEffectDisplay = d3.select("#pull_effect_display");
        this.showGuidelinesCheckbox = d3.select("#checkbox_show_guidelines");
        this.showZeroCoefficientsCheckbox = d3.select("#checkbox_show_zero_coefficients");
        this.usePositiveNegativeGradientCheckbox = d3.select("#checkbox_positive_negative_gradient");
        this.probabilityModeCheckbox = d3.select("#checkbox_probabilities_mode");
        this.brushActiveCheckbox = d3.select("#checkbox_brush_active");
        this.buttonSetStandardDeviation = d3.select("#button_standard_deviation");
        this.buttonClearSelection = d3.select("#button_clear_selection");
        this.selectionInfoPane = d3.select("#selection_info_pane");

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

        this.dotPlot = new DotPlot(this.dotPlotElementName, this.dataSource.datasets, (selectedFeatures) => {
            this.selectionUpdate();
        });
        this.dotPlot.initPlot();
        this.dotPlot.drawPlot();

        this.prepareInterface();
    }

    prepareInterface() {
        document.getElementsByName("radio_color_coding").forEach(element => {
            element.onclick = () => { 
                switch (element.id) {
                    case ColorCodings.PositiveNegative:
                        this.selectCategoricalCoding.attr("disabled", "");
                        this.selectNumericCoding.attr("disabled", "");
                        this.inputPullEffect.attr("disabled", null);

                        this.dotPlot.useGradient = false;

                        this.dotPlot.groupColumn = "_sign";
                        break;
                    case ColorCodings.NumericCoding:
                        this.updateNumericCodingColumn();
                        this.selectCategoricalCoding.attr("disabled", "");
                        this.selectNumericCoding.attr("disabled", null);
                        this.inputPullEffect.attr("disabled", "");
                        this.dotPlot.useGradient = true;
                        break;
                    case ColorCodings.CategoricalCoding:
                        this.updateCategoricalCodingColumn();
                        this.selectCategoricalCoding.attr("disabled", null);
    
                        // Reset the gradient manually
                        //this.usePositiveNegativeGradientCheckbox.node().checked = false;
                        this.dotPlot.useGradient = false;
    
                        this.selectNumericCoding.attr("disabled", "");
                        this.inputPullEffect.attr("disabled", "");
                        break;
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
            document.getElementById("radio_view_external_only").disabled = true;
            document.getElementById("radio_color_coding_numeric").disabled = true;
        }

        let clusterColumns = [ "_none" ];
        if (this.dataSource.clusterColumns.length != 0) {
            clusterColumns = clusterColumns.concat(this.dataSource.clusterColumns);
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
        
        this.selectClustering.selectAll("option")
                           .data(clusterColumns)
                           .enter()
                           .append("option")
                           .attr("value", d => d)
                           .text(d => d == "_none" ? "None" : d);

        this.selectNumericCoding.selectAll("option")
                                .data(["coefficient"].concat(externalVariables))
                                .enter()
                                .append("option")
                                .attr("value", d => d)
                                .text(d => d);

        this.selectSizeCoding.selectAll("option")
                             .data(["_none", "coefficient_abs"].concat(externalVariables))
                             .enter()
                             .append("option")
                             .attr("value", d => d)
                             // No questions please! :-)
                             .text(d => d == "_none" ? "None" : d == "coefficient_abs" ? "coefficient" : d);

        this.selectExternal.on("change", () => { 
            this.updateExternalColumn();
            this.dotPlot.updatePlot();
        });

        this.selectExternal2D.on("change", () => { 
            this.updateExternal2DColumn();
            this.dotPlot.updatePlot();
        });

        this.selectClustering.on("change", () => { 
            this.updateClustering();
        });
        
        /* Unlock size coding */
        this.selectSizeCoding.attr("disabled", null);

        // Unlock text coding
        this.selectTextCoding.attr("disabled", null);

        this.showGuidelinesCheckbox.on("change", () => {
            this.dotPlot.showGuidelines = this.showGuidelinesCheckbox.node().checked;
        })

        this.showZeroCoefficientsCheckbox.on("change", () => {
            this.dotPlot.showZeroCoefficients = this.showZeroCoefficientsCheckbox.node().checked;
        })

        this.probabilityModeCheckbox.on("change", () => {
            this.dotPlot.probabilityMode = this.probabilityModeCheckbox.node().checked;
        })

        this.usePositiveNegativeGradientCheckbox.on("change", () => {
            this.dotPlot.useGradient = this.usePositiveNegativeGradientCheckbox.node().checked;
        })

        this.brushActiveCheckbox.on("change", () => {
            this.dotPlot.brushActive = this.brushActiveCheckbox.node().checked;
        })

        new PullEffectComponent(this.inputPullEffect,
                                this.pullEffectDisplay,
                                (pullFilterValue) => { this.dotPlot.filterValue = pullFilterValue; },
                                () => { return this.dotPlot.filterValue; },
                                d3.select("#pull_effect_dispersion_dropdown"),
                                (dispersionMeasure) => { this.dotPlot.useDispersionMeasure(dispersionMeasure, "filter") });

        new PullEffectComponent(d3.select("#input_pull_effect_text_precondition"),
                                d3.select("#pull_effect_display_text_precondition"),
                                (pullFilterValue) => { this.dotPlot.textFilterValue = pullFilterValue; },
                                () => { return this.dotPlot.textFilterValue; },
                                d3.select("#pull_effect_dispersion_dropdown_text_precondition"),
                                (dispersionMeasure) => { this.dotPlot.useDispersionMeasure(dispersionMeasure, "text") });

        this.buttonClearSelection.on("click", () => { 
            this.dotPlot.manualClearSelection();
            if (this.dotPlot.brush != null) {
                this.dotPlot.cancelBrush();
            }
        });

        let codingVariables = [ ];
        if (this.dataSource.codingAvailable) {
            codingVariables = codingVariables.concat(this.dataSource.stringColumns);
        } else {
            document.getElementById("radio_color_coding_categorical").disabled = true;
        }
        
        this.selectCategoricalCoding.selectAll("option")
                           .data(codingVariables)
                           .enter()
                           .append("option")
                           .attr("value", d => d)
                           .text(d => d == "_sign" ? "Positive/negative coefficient" : d);

        this.selectTextCoding.selectAll("option")
                             .data(["_none", "feature"].concat(codingVariables))
                             .enter()
                             .append("option")
                             .attr("value", d => d)
                             // No questions please! :-)
                             .text(d => d == "_none" ? "None" : d);

        this.selectCategoricalCoding.on("change", () => { 
            this.updateCategoricalCodingColumn();
        });

        this.selectNumericCoding.on("change", () => { 
            this.updateNumericCodingColumn();
        });

        this.selectSizeCoding.on("change", () => { 
            this.updateSelectSizeCodingColumn();
        });

        this.selectTextCoding.on("change", () => { 
            this.updateSelectTextCodingColumn();
        });

        document.getElementsByName("radio_view").forEach(element => {
            element.onclick = () => { 
                let axisMode = element.id;
                let chartMode;

                if (axisMode == AxisModes.CoefficientsOnly) {
                    chartMode = ChartModes.DotPlot;

                    this.selectExternal.attr("disabled", "");
                    this.selectExternal2D.attr("disabled", "");
                    this.selectClustering.attr("disabled", "");
                    //this.brushActiveCheckbox.attr("disabled", ""); 
                    this.dotPlot.externalColumn = null;
                    this.dotPlot.externalColumnX = null;
                    this.dotPlot._clusterColumn = null;
                } else {
                    chartMode = ChartModes.ScatterPlot;

                    if (axisMode == AxisModes.CoefficientsExternal) {
                        this.updateExternalColumn(false);
                        this.selectExternal.attr("disabled", null);
                        this.selectExternal2D.attr("disabled", "");   
                        this.selectClustering.attr("disabled", ""); 
                        //this.brushActiveCheckbox.attr("disabled", ""); 
                        this.dotPlot._clusterColumn = null; 
                    } else if (axisMode == AxisModes.ExternalOnly) {
                        this.updateExternal2DColumn();
                        this.updateClustering();
                        this.selectExternal2D.attr("disabled", null);
                        this.selectClustering.attr("disabled", null);
                        //this.brushActiveCheckbox.attr("disabled", null);
                        this.selectExternal.attr("disabled", "");   
                    }
                }

                this.dotPlot.currentChartMode = chartMode;
            };
        });

        // Colour palette upload
        d3.select("#input_color_palette").on("change", (event) => {
            let reader = new FileReader()
            reader.onload = () => {
                try {
                    let colorPalette = JSON.parse(reader.result);
                    d3.select("#label_color_palette").style("background-color", colorPalette[0]);
                    this.dotPlot.setColorPalette(colorPalette);
                }
                catch (error) {
                    console.log(error);
                }
            }
            reader.readAsText(event.target.files[0])
        })
    }

    selectionUpdate() {
        // Clear current selection pane
        this.selectionInfoPane.html("");

        let listGroups = {};
        let groupColors = {};
        let notices = {};
        let groupFrequencies = {};

        this.dotPlot.signGroups.forEach(signGroup => {
            groupFrequencies[signGroup] = 0;
        });

        this.dotPlot.signGroups.forEach(signGroup => {
            let card = document.createElement("div");
            card.className = "card mb-3";

            let cardHeader = document.createElement("div");

            let signColor = this.dotPlot.colorScale(signGroup);
            groupColors[signGroup] = signColor;

            cardHeader.className = "card-header text-white";
            cardHeader.innerHTML = `<div class="wrapper">
                                    <i style="color: ${signColor};" class="bi bi-circle-fill"></i></div> 
                                    ${signGroup}</div>`;

            let cardBody = document.createElement("div");
            cardBody.className = "card-body text-white";

            card.appendChild(cardHeader);
            card.appendChild(cardBody);

            let listGroup = document.createElement("ul");
            listGroup.className = "list-group";
            listGroup.id = `group_${signGroup}`;

            listGroups[signGroup] = listGroup;

            cardBody.appendChild(listGroup);

            let noFeaturesNotice = document.createElement("span");
            noFeaturesNotice.innerHTML = "No features in selection.";
            notices[signGroup] = d3.select(noFeaturesNotice);

            cardBody.appendChild(noFeaturesNotice);

            this.selectionInfoPane.node().appendChild(card);
        });

        const formatFunction = d3.format(".2f");
        const percentageFunction = d3.format(".0%");

        this.dotPlot.coefficients.forEach(row => {
            if (!(this.dotPlot.selectedCoefficients.items.includes(row["feature"]))) {
                return;
            }

            let listGroupItem = document.createElement("li");
            listGroupItem.className = "list-group-item d-flex justify-content-between align-items-center text-white";
            listGroupItem.innerText = row["feature"];

            let coefficientPill = document.createElement("span");
            coefficientPill.className = "badge rounded-pill";
            coefficientPill.style.backgroundColor = groupColors[row["_sign"]];
            coefficientPill.innerText = formatFunction(row["coefficient"]);

            listGroupItem.appendChild(coefficientPill);

            listGroups[row["_sign"]].appendChild(listGroupItem);
            groupFrequencies[row["_sign"]]++;

            // Disable notice for this sign group
            notices[row["_sign"]].style("display", "none");
        })

        // Selection stats table
        let table = d3.select("#table_selection_stats");
        table.html(""); // reset table

        // Table header
        table.style("text-align", "center")
             .append('thead')
             .append('tr')
             .selectAll('th')
             .data(this.dotPlot.signGroups)
             .enter()
             .append("th")
             .html(signGroup => `<i style="color: ${groupColors[signGroup]};" class="bi bi-circle-fill"></i>`);

        // Frequencies
        table.append('tbody')
             .append('tr')
             .selectAll('td')
             .data(Object.values(groupFrequencies))
             .enter()
             .append('td')
             .html(d => d);

        // Relative frequencies
        table.append('tbody')
             .append('tr')
             .selectAll('td')
             .data(Object.values(groupFrequencies))
             .enter()
             .append('td')
             .html(d => d != 0 ? percentageFunction(d / this.dotPlot.selectedCoefficients.count) : "/");

        const totalDefinite = groupFrequencies[this.dotPlot.signGroups[0]] + groupFrequencies[this.dotPlot.signGroups[1]];
        
        // Relative frequencies (only defined)
        table.append('tbody')
             .append('tr')
             .selectAll('td')
             .data(Object.values(groupFrequencies))
             .enter()
             .append('td')
             .html((d, i) => (d != 0 && i <= 1) ? percentageFunction(d / totalDefinite) : "/");
    }

    updateExternalColumn() {
        this.dotPlot.externalColumn = this.selectExternal.node().value;
    }

    updateExternal2DColumn() {
        this.dotPlot.externalColumn = `${this.selectExternal2D.node().value}²`;
    }

    updateClustering() {
        this.dotPlot.clusterColumn = `${this.selectClustering.node().value}`;
    }

    updateCategoricalCodingColumn() {
        this.dotPlot.groupColumn = this.selectCategoricalCoding.node().value;
    }

    updateNumericCodingColumn() {
        this.dotPlot.groupColumn = this.selectNumericCoding.node().value;
    }

    updateSelectSizeCodingColumn() {
        this.dotPlot.sizeColumn = this.selectSizeCoding.node().value;
    }

    updateSelectTextCodingColumn() {
        this.dotPlot.textColumn = this.selectTextCoding.node().value;
    }
}