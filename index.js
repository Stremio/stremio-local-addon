const addonSDK = require('stremio-addon-sdk')
const fetch = require('node-fetch')

const pkg = require('./package')

// Define the addon
const addon = new addonSDK({
	id: 'org.stremio.local',
	version: pkg.version,
	description: pkg.description,

	name: 'Local Files',

	// Properties that determine when Stremio picks this add-on
	resources: ['catalog', 'meta'],
	types: ['movie', 'series', 'other'],

	idPrefixes: ['local:', 'bt:'],

	// @TODO: search?
	catalogs: [
		{ type: 'movie', id: 'local' },
		{ type: 'series', id: 'local' }
	]
})

// Constants
const PAGE_SIZE = 100
const ENGINE_URL = 'http://127.0.0.1:11470'

const PREFIX_BT = 'bt:'
const PREFIX_LOCAL = 'local:'

// Internal modules
const mapEntryToMeta = require('./lib/mapEntryToMeta')
const Storage = require('./lib/storage')
const findFiles = require('./lib/findFiles')
const indexer = require('./lib/indexer')

const storage = new Storage()

addon.defineCatalogHandler(function(args, cb) {
	// @TODO
	// @TODO: return a catalog of all indexed items, sorted by last indexed
	// an item id would either be local:tt<imdbId> or local:bt:IH
})

addon.defineMetaHandler(function(args, cb) {
	const entry = storage.getAggrEntry(args.id)

	if (entry) {
		mapEntryToMeta(entry, function(err, meta) {
			cb(err, meta ? { meta: meta } : null)
		})
	} else if (args.id.indexOf(PREFIX_BT) === 0) {
		getNonIndexedTorrent(args.id.slice(PREFIX_BT.length), cb)
	} else {
		cb(new Error('entry not found'))
	}
})

// @TODO: stremio-addon-sdk should have a .getRouter() method to be usable in another express server
// Start the add-on
addon.run()

// NOTE: storage.load just loads existing records from the fs
// we don't need to wait for it in order to use the storage, so we don't wait for it
// to start the add-on and we don't consider it fatal if it fails

// @TODO: proper path
storage.load('./localFiles', function(err) {
	if (err) console.log(err)

	// Start indexing

	// Storage: contains a hash map by filePath and another one by itemId; both point to entry objects (an array of files)
	// Indexing: turns a filePath into an entry { id, filePath, itemId, files, ih }

	findFiles().on('file', onDiscoveredFile)
})

function onDiscoveredFile(fPath) {
	indexLog(fPath, 'discovered')

	if (storage.byFilePath.has(fPath)) {
		indexLog(fPath, 'already indexed')
		return
	}

	indexer.indexFile(fPath, function(err, entry) {
		if (err) {
			indexLog(fPath, 'indexing error: '+(err.message || err))
			return
		}

		if (entry) storage.saveEntry(fPath, entry, function(err) {
			if (err) console.log(err)
			else indexLog(fPath, 'is now indexed: '+entry.itemId)
		})
	})
}

function indexLog(fPath, status) {
	console.log('-> '+fPath+': '+status)
}

function getNonIndexedTorrent(ih, cb) {
	fetch(ENGINE_URL+'/'+ih+'/create', { method: 'POST' })
	.then(function(resp) { return resp.json() })
	.then(function(resp) {
		indexer.indexParsedTorrent(resp, function(err, entry) {
			if (err) return cb(err)
			if (!entry) return cb(new Error('internal err: no entry from indexParsedTorrent'))

			mapEntryToMeta(entry, function(err, meta) {
				cb(err, meta ? { meta: meta } : null)
			})
		})
	})
	.catch(cb)
}