class DataSource {
    constructor() {
        this.skipColumns = ["feature", "coefficient"];
        this.numericColumns = [];
        this.stringColumns = [];
    }

    setCoefficientsUrl(coefficientsUrl) {
        // We define which datasets *can* be loaded
        this.datasets = { "coefficients": d3.csv(coefficientsUrl, d3.autoType) };
    }

    async load() {
        // We collect all promises to try to resolve them
        let promises = Object.values(this.datasets);
        // We also collect all keys, so we know to what dataset each promise belongs
        let keys = Object.keys(this.datasets);

        // We give all promises and try whether they resolve
        await Promise.allSettled(promises).then(results => {
            let i = 0;
            // Go over each dataset we defined earlier
            for (let dataset in this.datasets) {
                // If the promise was succesful, we retrieve the value of that promise
                // Else, we set the dataset to null
                switch (results[i]["status"]) {
                    case "fulfilled":
                        this.datasets[keys[i]] = results[i]["value"];
                        break;
                    case "rejected":
                        this.datasets[keys[i]] = null;
                        break;
                }

                i++;
            }
        });

        this.findOtherSources();

        return true;
    }

    findOtherSources() {
        if (!this.availableDatasets.includes("coefficients")) {
            return;
        }

        this.numericColumns = this.datasets["coefficients"].columns.filter(column => {
            if (this.skipColumns.includes(column)) {
                return false;
            }

            return this.datasets["coefficients"].map(d => d[column]).every(Number.isInteger); });

        this.stringColumns = this.datasets["coefficients"].columns.filter(column => {
            if (this.skipColumns.includes(column)) {
                return false;
            }

            return this.datasets["coefficients"].map(d => d[column]).every(i => typeof i === "string"); });
    }

    get codingAvailable() {
        return this.stringColumns.length > 0;
    }

    get externalAvailable() {
        return this.numericColumns.length > 0;
    }

    get availableDatasets() {
        return Object.keys(this.datasets).filter(dataset => this.datasets[dataset] != null);
    }
}