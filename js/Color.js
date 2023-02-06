// https://gist.github.com/jurv/bff64ce786dd5f6058f9d94e3c70fe47#file-color-js

function shouldTextBeBlack (backgroundcolor) {
    return computeLuminence(backgroundcolor) > 0.250;
}

function computeLuminence(backgroundcolor) {
    var colors = hexToRgb(backgroundcolor);
    
    var components = ['r', 'g', 'b'];
    for (var i in components) {
        var c = components[i];
        
        colors[c] = colors[c] / 255.0;

        if (colors[c] <= 0.03928) { 
            colors[c] = colors[c]/12.92;
        } else { 
            colors[c] = Math.pow (((colors[c] + 0.055) / 1.055), 2.4);
        }
    }
    
    var luminence = 0.2126 * colors.r + 0.7152 * colors.g + 0.0722 * colors.b;

    return luminence;
}

function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}