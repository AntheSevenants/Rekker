// Currently unused, might implement if I'm brave enough

class Coefficients {
    #dataset;
    #data;
    #values;
    #features;

    constructor(dataset) {
        // "dataset" contains the coefficient rows as found in the CSV file
        this.#dataset = dataset;
        // Sort dataset by coefficient value first
        this.#dataset.sort((a, b) => { return +a.coefficient - +b.coefficient });

        this.#features = this.#dataset.map(row => row.feature);

        this.#populateDataObject();
    }

    // Internal data object, based on *keys* rather than records
    // The key is the feature, the values are included
    #populateDataObject() {

        this.#data = {};
        this.#dataset.forEach(row => {
            this.#data[row.feature] = row;
        });
    }

    // Lists of feature names
    get mainFeatures() {
        return this.features.filter(feature => feature.charAt(0) != "_");
    }

    get otherFeatures() {
        return this.features.filter(feature => feature.charAt(0) == "_");
    }

    // Raw feature values
    get values() {
        return this.mainFeatures.map(feature => this.getCoefficientValue(feature));
    }

    get valuesNonZero() {
        return this.values.filter(value => value != 0);
    }

    // count
    get count() {
        return this.mainFeatures.length;
    }

    get length() {
        return this.count;
    }

    // Abstracted away coefficient value getters
    // These make it easier to do manipulations on the values
    getCoefficientValue(feature, adjusted = true) {
        return this.#data[feature]["coefficient"];
    }

    getCoefficientAsProbability(feature) {
        let value = this.getCoefficientValue(feature);
        return Helpers.logit2prob(value);
    }

    getCoefficientAbsoluteValue(feature) {
        let value = this.getCoefficientValue(feature);
        return Math.abs(value);
    }

    getCoefficientSign(feature) {
        // If the coefficient is zero, it was removed
        if (this.getCoefficientValue(feature, false) == 0) {
            return "removed";
        } // If it wasn't removed, just check the polarity
        else {
            return this.getCoefficientValue(feature) < 0 ?
                "negative" : "positive";
        }
    }

    // Get groups for a specific column
    getGroups(groupColumn) {
        let groups = [];
        for (const feature in this.mainFeatures) {
            groups.push(this.#data[feature][groupColumn]);
        }

        return Array.from(new Set(groups));
    }

    // Minimum / maximum value
    get minimumValue() {
        return +Math.min(...this.values);
    }

    get maximumValue() {
        return +Math.max(...this.values);
    }
}