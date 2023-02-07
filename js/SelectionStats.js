class SelectionStats {
    constructor(selectionInfoPane, spanSelectionCount, spanSelectionFilterCount, dotPlot) {
        this.selectionInfoPane = selectionInfoPane;
        this.spanSelectionCount = spanSelectionCount;
        this.spanSelectionFilterCount = spanSelectionFilterCount;
        this.dotPlot = dotPlot;

        this.sortColumn = "coefficient";
    }

    update() {
        this.reset();
        this.updateCount();

        this.listGroups = {};
        this.groupColors = {};
        this.groupTextColors = {};
        this.notices = {};
        this.groupFrequencies = {};

        /* Prepare frequency object by setting frequency counts to zero */
        this.dotPlot.signGroups.forEach(signGroup => {
            this.groupFrequencies[signGroup] = 0;
        });

        /* Create a card for each sign group */
        // TODO: should this just become each *group*?
        this.dotPlot.signGroups.forEach(signGroup => {
            this.appendGroupCard(signGroup);
        });

        this.dotPlot.coefficients.sort((a, b) => Helpers.sortGeneral(a, b, this.sortColumn));

        // Go over each coefficient and check what group it belongs to
        this.dotPlot.coefficients.forEach(row => {
            this.appendFeature(row);
        });

        this.buildTable();
    }

    reset() {
        // Clear current selection pane
        this.selectionInfoPane.html("");
    }

    updateCount() {
        this.spanSelectionCount.html(this.dotPlot.selectedCoefficients.count);
        this.spanSelectionFilterCount.html(this.dotPlot.selectedCoefficients.count);
    }

    appendGroupCard(signGroup) {
        // Create required elements
        let card = document.createElement("div");
        card.className = "card mb-3";

        let cardHeader = document.createElement("div");

        // Get the right colours for this group
        let signColor = this.dotPlot.colorScale(signGroup);
        this.groupColors[signGroup] = signColor;
        this.groupTextColors[signGroup] = shouldTextBeBlack(signColor) ? "#111" : "#fff";;

        // Set the appropriate group name and colour
        cardHeader.className = "card-header text-white";
        cardHeader.innerHTML = `<div class="wrapper">
                            <i style="color: ${signColor};" class="bi bi-circle-fill"></i></div> 
                            ${signGroup}</div>`;

        let cardBody = document.createElement("div");
        cardBody.className = "card-body text-white";

        card.appendChild(cardHeader);
        card.appendChild(cardBody);

        // This is the list group to which items will be appended
        let listGroup = document.createElement("ul");
        listGroup.className = "list-group list-group-flush";
        listGroup.id = `group_${signGroup}`;

        this.listGroups[signGroup] = listGroup;

        cardBody.appendChild(listGroup);

        // We build a "no features" notice and hide it when an item is added to the group
        let noFeaturesNotice = document.createElement("span");
        noFeaturesNotice.innerHTML = "No features in selection.";
        this.notices[signGroup] = d3.select(noFeaturesNotice);

        cardBody.appendChild(noFeaturesNotice);

        this.selectionInfoPane.node().appendChild(card);

    }

    appendFeature(row) {
        if (!(this.dotPlot.selectedCoefficients.items.includes(row["feature"]))) {
            return;
        }

        const formatFunction = d3.format(".2f");

        let listGroupItem = document.createElement("li");
        listGroupItem.className = "list-group-item list-group-item-action d-flex justify-content-between align-items-center text-white";
        listGroupItem.innerText = row["feature"];

        let element = d3.select(`circle[feature='${row["feature"]}']`);

        listGroupItem.onmouseover = () => {
            this.dotPlot.mouseOverPoint(row, element);
        };

        listGroupItem.onmouseleave = () => {
            this.dotPlot.mouseOut(row, element);
        };

        let coefficientPill = document.createElement("span");
        coefficientPill.className = "badge rounded-pill";
        coefficientPill.style.backgroundColor = this.groupColors[row["_sign"]];
        coefficientPill.style.color = this.groupTextColors[row["_sign"]];
        coefficientPill.innerText = formatFunction(row["coefficient"]);

        listGroupItem.appendChild(coefficientPill);

        this.listGroups[row["_sign"]].appendChild(listGroupItem);
        this.groupFrequencies[row["_sign"]]++;

        // Disable notice for this sign group
        this.notices[row["_sign"]].style("display", "none");
    }

    buildTable() {
        const percentageFunction = d3.format(".0%");

        // Selection stats table
        let table = d3.select("#table_selection_stats");
        table.html(""); // reset table

        // Table header
        table.style("text-align", "center")
            .append('thead')
            .append('tr')
            .selectAll('th')
            .data(this.dotPlot.signGroups)
            .enter()
            .append("th")
            .html(signGroup => `<i style="color: ${this.groupColors[signGroup]};" class="bi bi-circle-fill"></i>`);

        // Frequencies
        table.append('tbody')
            .append('tr')
            .selectAll('td')
            .data(Object.values(this.groupFrequencies))
            .enter()
            .append('td')
            .html(d => d);

        if (this.dotPlot.selectedCoefficients.count == 0) {
            return;
        }

        // Relative frequencies
        table.append('tbody')
            .append('tr')
            .selectAll('td')
            .data(Object.values(this.groupFrequencies))
            .enter()
            .append('td')
            .html(d => d != 0 ? percentageFunction(d / this.dotPlot.selectedCoefficients.count) : "&nbsp;");

        const totalDefinite = this.groupFrequencies[this.dotPlot.signGroups[0]] + this.groupFrequencies[this.dotPlot.signGroups[1]];
        this.spanSelectionFilterCount.html(totalDefinite);

        // Relative frequencies (only defined)
        table.append('tbody')
            .append('tr')
            .selectAll('td')
            .data(Object.values(this.groupFrequencies))
            .enter()
            .append('td')
            .html((d, i) => (d != 0 && i <= 1) ? percentageFunction(d / totalDefinite) : "&nbsp;");

    }
}