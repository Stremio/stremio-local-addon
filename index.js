const addonSDK = require('stremio-addon-sdk')
const fetch = require('node-fetch')

const pkg = require('./package')

// Constants
const PAGE_SIZE = 100
const ENGINE_URL = 'http://127.0.0.1:11470'

const PREFIX_BT = 'bt:'
const PREFIX_LOCAL = 'local:'

// Define the addon
const addon = new addonSDK({
	id: 'org.stremio.local',
	version: pkg.version,
	description: pkg.description,

	name: 'Local Files',

	// Properties that determine when Stremio picks this add-on
	resources: ['catalog', 'meta'],
	types: ['movie', 'series', 'other'],

	idPrefixes: [PREFIX_BT, PREFIX_LOCAL],

	// @TODO: search?
	catalogs: [
		{ type: 'other', id: 'local' },
	]
})

// Internal modules
const mapEntryToMeta = require('./lib/mapEntryToMeta')
const mapToCatalog = require('./lib/mapToCatalog')
const Storage = require('./lib/storage')
const findFiles = require('./lib/findFiles')
const indexer = require('./lib/indexer')

const storage = new Storage()

addon.defineCatalogHandler(function(args, cb) {
	mapToCatalog(storage, args, cb)
})

addon.defineMetaHandler(function(args, cb) {
	const entry = storage.getAggrEntry(args.id)

	if (entry) {
		// Saved entry is found
		mapEntryToMeta(entry, function(err, meta) {
			cb(err, meta ? { meta: meta } : null)
		})
	} else if (args.id.indexOf(PREFIX_BT) === 0) {
		// Saved entr is not found, but we can make an entry from a torrent
		getNonIndexedTorrent(args.id.slice(PREFIX_BT.length), cb)
	} else {
		cb(new Error('entry not found'))
	}
})

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

function onDiscoveredFile(fPath) {
	indexLog(fPath, 'discovered')

	// Storage: contains a hash map by filePath and another one by itemId; both point to entry objects
	// Indexing: turns a filePath into an entry { id, filePath, itemId, files, ih }

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
			else indexLog(fPath, 'is now indexed: '+(entry.itemId ? entry.itemId : 'non-interesting (no itemId)'))
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

module.exports = { addon, startIndexing }