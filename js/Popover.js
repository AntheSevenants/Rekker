function showPopover(element) {
    d3.select(".popover").remove();

    let popover = new bootstrap.Popover(element, { "sanitize": false, "delay": { "show": 0, "hide": 0 } });
    popover.show();
}