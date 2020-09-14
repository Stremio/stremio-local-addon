const pkg = require('../package')
var fs = require('fs')
var byline = require('byline')
var promisify = require('util').promisify

// The database structure is like:
// { id: PrimaryKey, entry: RecordedData, v: storageVersion }

// The opts may be some of:
// entryIndexes - Array of entry properties to be indexed
// validateRecord - function used on load to validate a record. If record is considered invalid the storage is rebuilt
function Storage(opts) {
	var self = this;
	this.opts = Object.assign({
		entryIndexes: [],
		validateRecord: null,
	}, opts)
	
	this.indexes = {
		primaryKey: new Map()
	}

	this.opts.entryIndexes.forEach(function(key) {
		self.indexes[key] = new Map();
	})

	var writeStream

	this.load = function(dbPath) {
		var truncate = false
		var open = promisify(fs.open);
		var close = promisify(fs.close);
		return open(dbPath, 'a+')
		.then(function(fd) {
			return new Promise(function(resolve) {
				fs.createReadStream(null, { fd: fd, autoClose: false })
				.on('error', onInternalErr)
				.pipe(byline())
				.on('error', onInternalErr)
				.on('data', function(line) {
					var record
					try {
						record = JSON.parse(line.toString())
						if(record.v !== pkg.version) throw "Version missmatch";
						if(self.opts.validateRecord) {
							self.opts.validateRecord(record.id, record.entry);
						}
						commitEntry(record.id, record.entry)
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
							self.indexes.primaryKey.forEach(function(entry, key) {
								persistEntry(key, entry)
							})
						}
					})
					.catch(onInternalErr)
					.then(resolve)
				})
			})
		})
	}

	this.saveEntry = function(primaryKey, entry, cb) {
		if (self.indexes.primaryKey.has(primaryKey)) return cb()
		commitEntry(primaryKey, entry)
		persistEntry(primaryKey, entry, cb)
	}

	this.getAggrEntry = function(index, key, groups) {
		const items = this.indexes[index].get(key)
		if (!items) return null
	
		let entry
		items.forEach(function(item) {
			// copy the first entry, therefore maintaining stuff like {name, ih, sources}
			if (!entry) {
				entry = Object.assign({ }, item)
				return;
			}
			for(let group of groups) {
				if(typeof entry[group] === 'undefined') return;
				if(!Array.isArray(entry[group])) entry[group] = [entry[group]];
				entry[group] = entry[group].concat(item[group]);
			}
		})
	
		return entry
	}

	// This function creates the storage indexes
	function commitEntry(key, entry) {
		self.indexes.primaryKey.set(key, entry)

		self.opts.entryIndexes.forEach(function(property) {
			if(!entry[property]) return;
			if(!self.indexes[property].has(entry[property])) {
				self.indexes[property].set(entry[property], new Map())
			}
			self.indexes[property].get(entry[property]).set(key, entry)
		})
	}

	function persistEntry(key, entry, cb) {
		if (!writeStream) return cb(new Error('unable to persist, no fd'))
		writeStream.write(JSON.stringify({ id: key, entry: entry, v: pkg.version })+'\n', cb)
	}

	function onInternalErr(err) {
		console.error('storage', err)
	}
}

module.exports = Storage