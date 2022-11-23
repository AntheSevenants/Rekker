class Helpers {
	// https://stackoverflow.com/a/42429255
	static mergeVariables(coordinates, variables) {
		let m = new Map();
		// Insert all entries keyed by ID into the Map, filling in placeholder
		// properties since the original coordinates objects don't contain these:
		coordinates.forEach((coordRow) => { 
			for (let key in variables[0]) {
				// Don't overwrite the features
				if (key == "feature") continue;
			}
			m.set(coordRow["feature"], coordRow);
		});

		// For values in 'variables', insert them if missing, otherwise, update existing values:
		variables.forEach((varRow) => {
    		let existing = m.get(varRow["feature"]);
    		if (existing === undefined) {
        		m.set(varRow._, varRow);
        	} else {
        		Object.assign(existing, varRow);
        	}
		});

		// Extract resulting combined objects from the Map as an Array
		return Array.from(m.values());
	}

	static uniqueValues(array, columnName) {
		return [...new Set( array.map(obj => obj[columnName])) ];
	}

	static sort(a, b) {
		return a - b;
	};
}