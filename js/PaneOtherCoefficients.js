class PaneOtherCoefficients {
    constructor(features, onUpdate) {
        // Filter only "other" features
        features = features.filter(feature => feature.startsWith("_is_"));

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

        this.features.forEach(feature => {
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
            label.for = inputId;
            label.innerHTML = feature;

            formDiv.appendChild(input);
            formDiv.appendChild(label);

            otherCoefficientsParent.node().appendChild(formDiv);
        });
    }
}