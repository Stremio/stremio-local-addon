const storage = {
	byItemId: new Map(),
	byFilePath: new Map(),
}

storage.load = function(cb) {
	cb()
}

module.exports = storage