class PaneOtherCoefficients {
    constructor(features, onUpdate) {
        features = features;

        this.features = features;
        this.onUpdate = onUpdate;
    }

    buildInterface() {
        if (this.features.length == 0) {
            return;
        }

        let otherCoefficientsParent = d3.select("#other_coefficients_parent");
        otherCoefficientsParent.classed("d-none", false);

        d3.select("#notice_other_coefficients")
          .text("Other coefficients:")
          .classed("mb-0", false);

        this.features.forEach(row => {
            const feature = row.feature;
            const value = row.coefficient;

            let parentDiv = document.createElement("div");
            parentDiv.className = "d-flex justify-content-between text-white";

            let formDiv = document.createElement("div");
            formDiv.className = "form-check form-switch text-white";

            let inputId = `checkbox_other_coefficient_${feature}`;

            let input = document.createElement("input");
            input.className = "form-check-input";
            input.type = "checkbox";
            input.role = "switch";
            input.id = inputId;

            input.onchange = () => {
                this.onUpdate(feature);
            };

            let label = document.createElement("label");
            label.className = "form-check-label";
            label.htmlFor = inputId;
            label.innerHTML = feature;

            formDiv.appendChild(input);
            formDiv.appendChild(label);

            let valueDiv = document.createElement("div");
            valueDiv.innerHTML = d3.format(".4f")(value);

            parentDiv.appendChild(formDiv);
            parentDiv.appendChild(valueDiv);

            otherCoefficientsParent.node().appendChild(parentDiv);
        });
    }
}