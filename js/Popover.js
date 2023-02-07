function showPopover(element) {
    let popover = new bootstrap.Popover(element, { "sanitize": false })
    popover.show();
}