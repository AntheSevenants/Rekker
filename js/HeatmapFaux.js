class HeatmapFaux {
    constructor() {
        // set the dimensions and margins of the graph
        const margin = { top: 10, right: 30, bottom: 30, left: 60 },
            width = 460 - margin.left - margin.right,
            height = 400 - margin.top - margin.bottom;

        // append the svg object to the body of the page
        const svg = d3.select("#my_dataviz")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform",
                `translate(${margin.left}, ${margin.top})`);

        //Read the data
        d3.csv("df_pred.csv").then(function (data) {

            // Add X axis
            const x = d3.scaleLinear()
                .domain([-2, 2])
                .range([0, width]);
            svg.append("g")
                .attr("transform", `translate(0, ${height})`)
                .call(d3.axisBottom(x));

            // Add Y axis
            const y = d3.scaleLinear()
                .domain([-2, 2])
                .range([height, 0]);
            svg.append("g")
                .call(d3.axisLeft(y));

            // Color scale: give me a specie name, I return a color
            // Build color scale
            const myColor = d3.scaleLinear()
                .range(["#A51626", "#FFFDBF", "#006837"])
                .domain([-0.5, 0, 0.5]);

            // Add dots
            svg.append('g')
                .selectAll("dot")
                .data(data)
                .join("circle")
                .attr("cx", function (d) { return x(d["mds.all.x"]); })
                .attr("cy", function (d) { return y(d["mds.all.y"]); })
                .attr("r", 3)
                .style("fill", function (d) { return myColor(d["fit"]) })

        })
    }
}