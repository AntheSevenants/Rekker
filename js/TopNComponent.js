class TopNComponent {
    constructor(inputElement, onChange) {
        this.inputElement = inputElement;
        this.onChange = onChange;

        this.inputElement.on("change",
                             () => { this.setOnChange(); });
    }

    setOnChange() {
        this.onChange(this.inputElement.node().value);
    }

    reset() {
        this.onChange(null);
    }
}