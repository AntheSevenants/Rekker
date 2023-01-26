class PullEffectComponent {
    constructor(sliderElement, displayElement, onUpdate) {
        this.sliderElement = sliderElement;
        this.displayElement = displayElement;
        this.onUpdate = onUpdate;

        this.setOnChange();
    }

    setOnChange() {
        this.sliderElement.on("change", () => {
            let pullFilterValue = this.sliderElement.node().value;
            this.displayElement.html(pullFilterValue);

            this.onUpdate(parseFloat(pullFilterValue));
        });
    }
}