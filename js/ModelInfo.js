class ModelInfo {
    constructor(modelInfoUrl) {
        this.modelInfoUrl = modelInfoUrl;
        this.data = null;
    }

    load() {
        return new Promise((resolve, reject) => {
            d3.csv(this.modelInfoUrl, d3.autoType).then(data => {
                this.data = data;
    
                resolve(this.data);
            });
        });
    }
}