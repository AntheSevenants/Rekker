class PaneOtherCoefficients {
    constructor(features) {
        // Filter only "other" features
        features.filter(feature => feature.startsWith("_is_"));

        this.features = features;
    }

    buildInterface() {
        d3.select("#other_coefficients_parent").classed("d-none", false);

        this.features.forEach(feature => {
            
        });
    }
}