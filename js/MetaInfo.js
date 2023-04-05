class MetaInfo {
    constructor(modelInfoUrl) {
        this.modelInfoUrl = modelInfoUrl;
        this.data = null;
    }

    load() {
        return new Promise((resolve, reject) => {
            d3.csv(this.modelInfoUrl, d3.autoType).then(data => {
                this.data = data;
                this.process(data);
    
                resolve(this.model);
            });
        });
    }

    process(data) {
        this.model = {};
        this.free = {};

        data.forEach(row => {
            if (row["subject"] != "model") {
                if (!(row["subject"] in this.free)) {
                    this.free[row["subject"]] = {};
                }

                this.free[row["subject"]][row["predicate"]] = row["object"];
            }

            this.model[row["predicate"]] = row["object"];
        });
    }
}