function toGroup(d) {
    return parseFloat(d).toFixed(8);
}

class Heatmap {
    constructor() {
        const margin = { top: 30, right: 30, bottom: 30, left: 30 },
            width = 450 - margin.left - margin.right,
            height = 450 - margin.top - margin.bottom;

        // append the svg object to the body of the page
        const svg = d3.select("#my_dataviz")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        //Read the data
        d3.csv("df_pred.csv").then(function (data) {

            // Labels of row and columns
            const myGroups = Helpers.uniqueValues(data, "mds.all.x").map(d => toGroup(d));
            const myVars = Helpers.uniqueValues(data, "mds.all.y").map(d => toGroup(d));

            console.log(myGroups);
            console.log(myVars);

            // Build X scales and axis:
            const x = d3.scaleBand()
                .range([0, width])
                .domain(myGroups)
                .padding(0.01);
            svg.append("g")
                .attr("transform", `translate(0, ${height})`)
                .call(d3.axisBottom(x))

            // Build X scales and axis:
            const y = d3.scaleBand()
                .range([height, 0])
                .domain(myVars)
                .padding(0.01);
            svg.append("g")
                .call(d3.axisLeft(y));

            // Build color scale
            const myColor = d3.scaleLinear()
                .range(["green", "red"])
                .domain([-1, 1])


            svg.selectAll()
                .data(data, function (d) { return toGroup(d["mds.all.x"]) + ':' + toGroup(d["mds.all.y"]); })
                .join("rect")
                .attr("x", function (d) { return x(toGroup(d["mds.all.x"])) })
                .attr("y", function (d) { return y(toGroup(d["mds.all.y"])) })
                .attr("width", x.bandwidth())
                .attr("height", y.bandwidth())
                .style("fill", function (d) { return myColor(d["fit"]) })

        })
    }
}