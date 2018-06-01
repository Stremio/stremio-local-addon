var fs = require('fs')
var byline = require('byline')

function Storage() {
	// structure is filePath -> Entry({ itemId, files }) where filePath is the unique one

	var byFilePath = new Map()

	var byItemId = new Map()

	var fd

	this.byFilePath = byFilePath

	this.load = function(dbPath, cb) {
		fs.open(dbPath, 'a+', function(err, descriptor) {
			if (err) return cb(err)
			fd = descriptor

			fs.createReadStream(null, { fd: fd, autoClose: false })
			.pipe(byline())
			.on('data', function(line) {
				var d 
				try {
					d = JSON.parse(line.toString())
					commitEntry(d.filePath, d.entry)
				} catch (e) {
					// @TODO: do something?
				}
			})
			.on('finish', function() {
				cb(null)
			})
		})
	}

	this.saveEntry = function(filePath, entry, cb) {
		if (byFilePath.has(filePath)) return cb()
		commitEntry(filePath, entry)
		persistEntry(filePath, entry, cb)
	}

	function commitEntry(filePath, entry) {
		byFilePath.set(filePath, entry)

		if (!byItemId.has(entry.itemId)) byItemId.set(entry.itemId, new Map())
		byItemId.get(entry.itemId).set(filePath, entry)
	} 

	function persistEntry(filePath, entry, cb) {
		if (!fd) return cb(new Error('unable to persist, no fd'))
		fs.write(fd, JSON.stringify({ filePath: filePath, entry: entry })+'\n', cb)
	}
}

module.exports = Storage