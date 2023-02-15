class TopNComponent {
    constructor(inputElement, onChange) {
        this.inputElement = inputElement;
        this.onChange = onChange;

        this.inputElement.on("change",
                             () => { this.onChange(this.inputElement.value); });
    }

    reset() {
        this.onChange(null);
    }
}