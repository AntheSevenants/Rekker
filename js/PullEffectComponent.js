class PullEffectComponent {
    constructor(sliderElement, displayElement, onUpdate, getFilterValue, dispersionDropdown, onDispersionSelect) {
        this.sliderElement = sliderElement;
        this.displayElement = displayElement;
        this.onUpdate = onUpdate;
        this.getFilterValue = getFilterValue;

        this.dispersionDropdown = dispersionDropdown;
        this.onDispersionSelect = onDispersionSelect;

        this.setOnChange();
        this.setDispersionButton();
    }

    setOnChange() {
        this.sliderElement.on("change", () => {
            let pullFilterValue = this.sliderElement.node().value;
            this.displayElement.html(pullFilterValue);

            this.onUpdate(parseFloat(pullFilterValue));
        });
    }

    setDispersionButton() {
        Constants.DispersionMeasures.forEach(dispersionMeasure => {
            let dropdownMenuItem = document.createElement("li");
            dropdownMenuItem.innerHTML = `<a class="dropdown-item dispersion">${dispersionMeasure}</a>`;

            dropdownMenuItem.onclick = () => { 
                this.onDispersionSelect(dispersionMeasure);

                /* Update display and input range automatically */
                let filterValue = this.getFilterValue();
                this.displayElement.html(d3.format(".2r")(filterValue));
                this.sliderElement.node().value = filterValue; };

            this.dispersionDropdown.node().appendChild(dropdownMenuItem);
        });
    }
}