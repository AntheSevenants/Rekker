class SelectionStats {
    constructor(dotPlot, defaultColumns) {
        this.selectionInfoPane = d3.select("#selection_info_pane");
        this.spanSelectionCount = d3.select("#span_selection_count");
        this.spanSelectionFilterCount = d3.select("#span_selection_filter_count");

        this.buttonSelectionSort = d3.select("#button_selection_sort");
        this.buttonSelectionSortIcon = d3.select("#button_selection_sort_icon");

        this.dotPlot = dotPlot;
        this.defaultColumns = defaultColumns;

        this.sortColumn = "coefficient";
        this._ascending = true;

        this.prepareInterface();
    }

    get ascending() {
        return this._ascending;
    }

    set ascending(ascending) {
        this._ascending = ascending;

        // Set the right item
        this.buttonSelectionSortIcon.attr("class", this.getOrderIcon());
        // Update view
        this.update();
    }

    prepareInterface() {
        this.buttonSelectionSort.on("click", () => { this.ascending = !this.ascending; });
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
        this.dotPlot.groups.forEach(group => {
            this.groupFrequencies[group] = 0;
        });

        /* Create a card for each group */
        this.dotPlot.groups.forEach(group => {
            this.appendGroupCard(group);
        });

        this.dotPlot.coefficients.sort((a, b) => Helpers.sortGeneral(a, b, this.sortColumn));
        if (!this.ascending) {
            this.dotPlot.coefficients.reverse();
        }

        // The contents of badge on the group item depends on what the sortColumn is
        let defaultBadge = this.defaultColumns.includes(this.sortColumn);
        // Go over each coefficient and check what group it belongs to
        this.dotPlot.coefficients.forEach(row => {
            this.appendFeature(row, defaultBadge);
        });

        this.buildTable();
    }

    reset() {
        // Clear current selection pane
        this.selectionInfoPane.html("");
    }

    getOrderIcon() {
        return this.ascending ? "bi bi-sort-up" : "bi bi-sort-down";
    }

    updateCount() {
        this.spanSelectionCount.html(this.dotPlot.selectedCoefficients.count);
        this.spanSelectionFilterCount.html(this.dotPlot.selectedCoefficients.count);
    }

    appendGroupCard(group) {
        // Create required elements
        let card = document.createElement("div");
        card.className = "card mb-3";

        let cardHeader = document.createElement("div");

        // Get the right colours for this group
        let groupColor = this.dotPlot.colorScale(group);
        this.groupColors[group] = groupColor;
        this.groupTextColors[group] = shouldTextBeBlack(groupColor) ? "#111" : "#fff";;

        // Set the appropriate group name and colour
        cardHeader.className = "card-header text-white";
        cardHeader.innerHTML = `<div class="wrapper">
                            <i style="color: ${groupColor};" class="bi bi-circle-fill"></i></div> 
                            ${group}</div>`;

        let cardBody = document.createElement("div");
        cardBody.className = "card-body text-white";

        card.appendChild(cardHeader);
        card.appendChild(cardBody);

        // This is the list group to which items will be appended
        let listGroup = document.createElement("ul");
        listGroup.className = "list-group list-group-flush";
        listGroup.id = `group_${group}`;

        this.listGroups[group] = listGroup;

        cardBody.appendChild(listGroup);

        // We build a "no features" notice and hide it when an item is added to the group
        let noFeaturesNotice = document.createElement("span");
        noFeaturesNotice.innerHTML = "No features in selection.";
        this.notices[group] = d3.select(noFeaturesNotice);

        cardBody.appendChild(noFeaturesNotice);

        this.selectionInfoPane.node().appendChild(card);

    }

    appendFeature(row, defaultBadge=true) {
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
        coefficientPill.style.backgroundColor = this.groupColors[row[this.dotPlot.groupColumn]];
        coefficientPill.style.color = this.groupTextColors[row[this.dotPlot.groupColumn]];

        if (defaultBadge) {
            coefficientPill.innerText = formatFunction(row["coefficient"]);
        } else {
            coefficientPill.innerText = row[this.sortColumn];
        }
        

        listGroupItem.appendChild(coefficientPill);

        this.listGroups[row[this.dotPlot.groupColumn]].appendChild(listGroupItem);
        this.groupFrequencies[row[this.dotPlot.groupColumn]]++;

        // Disable notice for this group
        this.notices[row[this.dotPlot.groupColumn]].style("display", "none");
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
            .data(this.dotPlot.groups)
            .enter()
            .append("th")
            .html(group => `<i style="color: ${this.groupColors[group]};" class="bi bi-circle-fill"></i>`);

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

        const totalDefinite = this.groupFrequencies[this.dotPlot.groups[0]] + this.groupFrequencies[this.dotPlot.groups[1]];
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