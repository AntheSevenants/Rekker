d3.csv("coefficients.csv").then( (data) => {
    let dotPlot = new DotPlot("dotplot", data);
    dotPlot.initPlot();
    dotPlot.drawPlot();
});