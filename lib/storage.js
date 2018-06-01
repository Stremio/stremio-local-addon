var fs = require('fs')
var byline = require('byline')

function Storage() {
	// structure is filePath -> Entry({ itemId, files }) where filePath is the unique one

	var byFilePath = new Map()

	var byItemId = new Map()

	var writeStream

	this.byFilePath = byFilePath
	this.byItemId = byItemId

	this.load = function(dbPath, cb) {
		fs.open(dbPath, 'a+', function(err, fd) {
			if (err) return cb(err)

			fs.createReadStream(null, { fd: fd, autoClose: false })
			.on('error', onInternalErr)
			.pipe(byline())
			.on('error', onInternalErr)
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
				writeStream = fs.createWriteStream(null, { fd: fd, autoClose: false })
				writeStream.on('error', onInternalErr)
				cb(null)
			})
		})
	}

	this.saveEntry = function(filePath, entry, cb) {
		if (byFilePath.has(filePath)) return cb()
		commitEntry(filePath, entry)
		persistEntry(filePath, entry, cb)
	}

	this.getAggrEntry = function(itemId) {
		const m = byItemId.get(itemId)
		if (!m) return null
		
		let files = []
		m.forEach(function(entry) {
			files = files.concat(entry.files)
		})

		return {
			itemId: itemId,
			files: files
		}
	}

	function commitEntry(filePath, entry) {
		byFilePath.set(filePath, entry)

		if (!entry.itemId) return
		
		if (!byItemId.has(entry.itemId)) byItemId.set(entry.itemId, new Map())
		byItemId.get(entry.itemId).set(filePath, entry)
	} 

	function persistEntry(filePath, entry, cb) {
		if (!writeStream) return cb(new Error('unable to persist, no fd'))
		writeStream.write(JSON.stringify({ filePath: filePath, entry: entry })+'\n', cb)
	}

	function onInternalErr(err) {
		console.error('storage', err)
	}
}

module.exports = Storage