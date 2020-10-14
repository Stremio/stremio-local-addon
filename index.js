const addonSDK = require('stremio-addon-sdk')
const fs = require('fs')

// Variables
let engineUrl = 'http://127.0.0.1:11470'

// Internal modules
const manifest = require('./lib/manifest')
const manifestNoCatalogs = require('./lib/manifestNoCatalogs')
const catalogHandler = require('./lib/catalogHandler')
const metaHandler = require('./lib/metaHandler')
const streamHandler = require('./lib/streamHandler')
const Storage = require('./lib/storage')
const findFiles = require('./lib/findFiles')
const indexer = require('./lib/indexer')
const mapEntryToMeta = require('./lib/mapEntryToMeta')

const MAX_INDEXED = 10000

// Initiate the storage
const storage = new Storage({
	validateRecord: function(index, entry) {
		fs.accessSync(index, fs.constants.R_OK)
	},
	entryIndexes: ['itemId'],
})
const metaStorage = new Storage()

// Define the addon
function addon(options) {
	options = options || {}
	const addonBuilder = new addonSDK(options.disableCatalogSupport ? manifestNoCatalogs : manifest)

	addonBuilder.defineCatalogHandler(function(args, cb) {
		catalogHandler(storage, metaStorage, args, cb)
	})

	addonBuilder.defineMetaHandler(function(args, cb) {
		metaHandler(storage, metaStorage, engineUrl, args, cb)
	})

	addonBuilder.defineStreamHandler(function(args, cb) {
		streamHandler(storage, args, cb)
	})
	return addonBuilder;
}

// Exported methods
function setEngineUrl(url) {
	engineUrl = url
}

function logError(err) {
	console.log('Error:', err);
}

function startIndexing(fPath) {
	// NOTE: storage.load just loads existing records from the fs
	// we don't need to wait for it in order to use the storage, so we don't wait for it
	// to start the add-on and we don't consider it fatal if it fails
	Promise.all([
		metaStorage.load(fPath+'Meta').catch(logError),
		storage.load(fPath).catch(logError)
	])
	.then(function(err) {
		// Start indexing
		findFiles().on('file', onDiscoveredFile)
	})
}

// Internal methods
function onDiscoveredFile(fPath) {
	// Storage: contains a hash map by filePath and another one by itemId; both point to entry objects
	// Indexing: turns a filePath into an entry { id, filePath, itemId, files, ih }

	if (storage.indexes.primaryKey.has(fPath)) {
		return
	}

	if (storage.indexes.primaryKey.size >= MAX_INDEXED) {
		return
	}

	indexer.indexFile(fPath, function(err, entry) {
		if (err) {
			indexLog(fPath, 'indexing error: '+(err.message || err))
			return
		}

		if (entry) {
			storage.saveEntry(fPath, entry, function(err) {
				if (err) console.log(err)
				else if(entry.itemId) indexLog(fPath, 'is now indexed: '+entry.itemId)
			})
			if(entry.files && entry.files.length > 0 && entry.itemId) {
				mapEntryToMeta(entry)
				.then(function(meta) {
					metaStorage.saveEntry(meta.id, meta, function() {});
				})
				.catch(()=>{})
			}
		}
	})
}

function indexLog(fPath, status) {
	console.log('-> '+fPath+': '+status)
}

module.exports = { addon, setEngineUrl, startIndexing }
