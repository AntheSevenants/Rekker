class ModelInfoPane {
    constructor(modelInfo) {
        this.modelInfo = modelInfo;

        this.modelInfoNotice = d3.select("#notice_model_info");
        this.modelInfoTable = d3.select("#table_model_info");

        this.prepareInterface();
    }

    prepareInterface() {
        // Hide model info notice, because we now have model info
        this.modelInfoNotice.classed("d-none", "true");

        // Selection stats table
        let table = this.modelInfoTable;
        // Show table
        table.classed("d-none", false);
        table.html(""); // reset table

        console.log(table);

        let columns = ["property", "value"];
        let modelInfo = Object.keys(this.modelInfo).map(property => {
            let value = this.modelInfo[property];

            // If number and including ., we need to format this number
            if (typeof value == "number" && value.toString().includes(".")) {
                // If ratio, convert to percentage
                if (property.includes("ratio")) {
                    value = d3.format(".0%")(value);
                } else {
                    value = d3.format(".4f")(value);
                }
            }

            return {
                "property": property,
                "value": value
            }
        });

        // Create a row for each object in the data
        let rows = table.append("tbody")
            .selectAll('tr')
            .data(modelInfo)
            .enter()
            .append('tr');

        // Create a cell in each row for each column
        let cells = rows.selectAll('td')
            .data(row => columns.map((column) => ({ column: column, value: row[column] })))
            .enter()
            .append('td')
            .classed("monospace", true)
            .text((d) => d.value);
    }
}