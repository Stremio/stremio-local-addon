function Storage() {
	this.byItemId = new Map()

	this.byFilePath = new Map()

	this.load = function(cb) {
		cb()
	}

	this.saveItem = function(item, cb) {

	}
}

module.exports = Storage