let dotPlotElementName = "dotplot";

d3.csv("coefficients.csv").then( (data) => {
    let dotPlot = new DotPlot(dotPlotElementName, data);
    dotPlot.initPlot();
    dotPlot.drawPlot();
}).catch((error) => {
    let errorMessage = "An error occurred while loading the dataset. ";
    errorMessage += "Do you have <code>coefficients.csv</code> in the Rekker directory?";
    errorMessage += `<br><br>${error}`;

    d3.select(`#${dotPlotElementName}`).html(errorMessage);
});