const addonSDK = require('stremio-addon-sdk')

// Variables
let engineUrl = 'http://127.0.0.1:11470'

// Internal modules
const manifest = require('./lib/manifest')
const catalogHandler = require('./lib/catalogHandler')
const metaHandler = require('./lib/metaHandler')
const streamHandler = require('./lib/streamHandler')
const Storage = require('./lib/storage')
const findFiles = require('./lib/findFiles')
const indexer = require('./lib/indexer')
const consts = require('./lib/consts')

const MAX_INDEXED = 10000

// Initiate the storage
const storage = new Storage()

// Define the addon
const addon = new addonSDK(manifest)

addon.defineCatalogHandler(function(args, cb) {
	catalogHandler(storage, args, cb)
})

addon.defineMetaHandler(function(args, cb) {
	metaHandler(storage, engineUrl, args, cb)
})

addon.defineStreamHandler(function(args, cb) {
	streamHandler(storage, args, cb)
})

// Exported methods
function setEngineUrl(url) {
	engineUrl = url
}

function startIndexing(fPath) {
	// NOTE: storage.load just loads existing records from the fs
	// we don't need to wait for it in order to use the storage, so we don't wait for it
	// to start the add-on and we don't consider it fatal if it fails
	storage.load(fPath, function(err) {
		if (err) console.log(err)

		// Start indexing
		findFiles().on('file', onDiscoveredFile)
	})
}

// Internal methods
function onDiscoveredFile(fPath) {
	// Storage: contains a hash map by filePath and another one by itemId; both point to entry objects
	// Indexing: turns a filePath into an entry { id, filePath, itemId, files, ih }

	if (storage.byFilePath.has(fPath)) {
		return
	}

	if (storage.byFilePath.size >= MAX_INDEXED) {
		return
	}

	indexer.indexFile(fPath, function(err, entry) {
		if (err) {
			indexLog(fPath, 'indexing error: '+(err.message || err))
			return
		}

		if (entry) storage.saveEntry(fPath, entry, function(err) {
			if (err) console.log(err)
			else if(entry.itemId) indexLog(fPath, 'is now indexed: '+entry.itemId)
		})
	})
}

function indexLog(fPath, status) {
	console.log('-> '+fPath+': '+status)
}

module.exports = { addon, setEngineUrl, startIndexing }
