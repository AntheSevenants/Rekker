class LocalStorage {
	static getList(key) {
		let localStorageValue = localStorage.getItem(key);

		if (localStorageValue === null) {
			return []
		}
		else {
			return JSON.parse(localStorageValue);
		}
	}

	static setList(key, list) {
		let stringifiedList = JSON.stringify(list);

		LocalStorage.setValue(key, stringifiedList);
	}

	static getValue(key) {
		return localStorage.getItem(key);
	}

	static setValue(key, value) {
		return localStorage.setItem(key, value);
	}
}