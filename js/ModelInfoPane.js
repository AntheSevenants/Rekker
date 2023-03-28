class ModelInfoPane {
    constructor(modelInfo) {
        this.modelInfo = modelInfo.filter(row => row["subject"] == "model");

        this.modelInfoNotice = d3.select("#notice_model_info");
        this.modelInfoTable = d3.select("#table_model_info");

        this.prepareInterface();
    }

    prepareInterface() {
        // Hide model info notice, because we now have model info
        this.modelInfoNotice.classed("d-none", "true");

        // Selection stats table
        let table = this.modelInfoTable;
        table.html(""); // reset table

        console.log(table);

        let columns = ["property", "value"];
        let modelInfo = this.modelInfo.map(row => {
            let value = row["object"];

            if (typeof row["object"] == "number" && row["object"].toString().includes(".")) {
                if (row["predicate"].includes("ratio")) {
                    value = d3.format(".0%")(value);
                } else {
                    value = d3.format(".4f")(value);
                }
            }

            return {
                "property": row["predicate"],
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