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

            let items = this.datasets["coefficients"].map(d => d[column]).filter(value => value != "NA");

            return items.every(i => typeof i === "number"); });

        this.numericColumns2D = [];

        // Sometimes, columns can be two-dimensional
        // In this case, collapse these columns into one column and add them to the 2D list;
        this.numericColumnsCollapsed = this.numericColumns.map(d => {
            // Filter regression coefficient and significance columns
            if (d.endsWith("_coeff") || d.endsWith("_sig")) {
                return null;
            }

            let suffix = d.slice(-2);
            switch(suffix) {
                // Column ends in .x
                case ".x":
                case ".y":
                    let checkSuffix = suffix == ".x" ? ".y" : ".x";

                    // Same column ending in .x/.y also exists
                    let baseColumnName = d.slice(0, -2);
                    if (this.numericColumns.includes(`${baseColumnName}${checkSuffix}`)) {
                        // Only return if we are checking .x, else we will get duplicates
                        if (suffix == ".x") {
                            this.numericColumns2D.push(baseColumnName);
                            return null;
                        } else {
                            return null;
                        }
                    // If same column ending does not exist, just return the column name as-is
                    } else {
                        return d;
                    }
                    break;
                // Other columns: return column name as is;
                default:
                    return d;
                    break;
            }
        }).filter(d => d != null);

        this.stringColumns = this.datasets["coefficients"].columns.filter(column => {
            if (this.skipColumns.includes(column)) {
                return false;
            }
            // Filter regression coefficient and significance columns
            if (column.endsWith("_coeff") || column.endsWith("_sig")) {
                return false;
            }

            let items = this.datasets["coefficients"].map(d => d[column]).filter(value => value != "NA");

            return items.every(i => typeof i === "string"); });

        this.clusterColumns = this.datasets["coefficients"].columns.filter(column => column.startsWith("cluster."));
    }

    get codingAvailable() {
        return this.stringColumns.length > 0;
    }

    get externalAvailable() {
        return this.numericColumnsCollapsed.length > 0;
    }

    get external2DAvailable() {
        return this.numericColumns2D.length > 0;
    }

    get availableDatasets() {
        return Object.keys(this.datasets).filter(dataset => this.datasets[dataset] != null);
    }
}