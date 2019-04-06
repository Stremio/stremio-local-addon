var fs = require('fs')
var byline = require('byline')
var promisify = require('util').promisify

function Storage() {
	// structure is filePath -> Entry({ itemId, files }) where filePath is the unique one

	var byFilePath = new Map()

	var byItemId = new Map()
	var byType = {}

	var writeStream

	this.byFilePath = byFilePath
	this.byItemId = byItemId
	this.byType = byType

	this.load = function(dbPath, cb) {
		var truncate = false
		var open = promisify(fs.open);
		var close = promisify(fs.close);
		open(dbPath, 'a+')
		.then(function(fd) {
			fs.createReadStream(null, { fd: fd, autoClose: false })
			.on('error', onInternalErr)
			.pipe(byline())
			.on('error', onInternalErr)
			.on('data', function(line) {
				var record
				try {
					record = JSON.parse(line.toString())
					fs.accessSync(record.filePath, fs.constants.R_OK)
					commitEntry(record.filePath, record.entry)
				} catch (e) {
					// If we have corrupred data or deleted/moved file
					// We will rewrite the database with only the healthy records
					truncate = true
				}
			})
			.on('finish', function() {
				Promise.resolve()
				.then(function() {
					if(truncate) {
						return close(fd)
						.then(function() {
							return open(dbPath, 'w')
						})
					}
					return fd
				})
				.then(function(fd) {
					writeStream = fs.createWriteStream(null, { fd: fd, autoClose: false })
					writeStream.on('error', onInternalErr)
					if(truncate) {
						byFilePath.forEach(function(entry, filePath) {
							persistEntry(filePath, entry)
						})
					}
				})
				.catch(onInternalErr)
				.then(cb)
			})
		})
		.catch(cb)
	}

	this.saveEntry = function(filePath, entry, cb) {
		if (byFilePath.has(filePath)) return cb()
		commitEntry(filePath, entry)
		persistEntry(filePath, entry, cb)
	}

	this.getAggrEntry = function(itemId) {
		const m = byItemId.get(itemId)
		if (!m) return null

		let entry
		m.forEach(function(e) {
			// copy the first entry, therefore maintaining stuff like {name, ih, sources}
			if (!entry) entry = Object.assign({ }, e)
			else entry.files = entry.files.concat(e.files)
		})

		return entry
	}

	function commitEntry(filePath, entry) {
		byFilePath.set(filePath, entry)

		if (!entry.itemId) return

		if (!byItemId.has(entry.itemId)) byItemId.set(entry.itemId, new Map())
		byItemId.get(entry.itemId).set(filePath, entry)

		if (!entry.files || !entry.files[0]) return

		var type = entry.files[0].type || 'other'
		byType[type] = byType[type] || new Set()
		byType[type].add(entry.itemId)
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