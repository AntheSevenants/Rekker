class Rekker {
    constructor() {
        this.dotPlotElementName = "dotplot";

        this.dataSource = new DataSource();
        this.dataSource.load().then(() => { this.execute(); });
    }

    execute() {
        let dotPlot = new DotPlot(this.dotPlotElementName, this.dataSource.datasets["coefficients"]);
        dotPlot.initPlot();
        dotPlot.drawPlot();
    }
}

rekker = new Rekker();