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

const mapTorrentToMeta = require('./lib/mapTorrentToMeta')
const Storage = require('./lib/storage')

const storage = new Storage()

addon.defineCatalogHandler(function(args, cb) {
	// @TODO
	// @TODO: return a catalog of all indexed items, sorted by last indexed
	// an item id would either be local:tt<imdbId> or local:bt:IH
})

addon.defineMetaHandler(function(args, cb) {
	// @TODO
	// if args.id begins with 'bt:'

	// @TODO: try cache first, then if not found, try 'bt:' via enginefs 

	if (args.id.indexOf(PREFIX_BT) === 0) {
		var ih = args.id.slice(PREFIX_BT.length)

		fetch(ENGINE_URL+'/'+ih+'/create', { method: 'POST' })
		.then(function(resp) { return resp.json() })
		.then(function(resp) {
			// @TODO: this response is not compatible with our mapTorrentToMeta in that there's no 'name' 
			mapTorrentToMeta(resp, function(err, meta) {
				if (err) return cb(err)
				cb(null, { meta: meta })
			})
		})
		.catch(cb)
	} else {
		// @TODO
	}
})

// @TODO: stremio-addon-sdk should have a .getRouter() method to be usable in another express server
// Start the add-on
addon.run()

// NOTE: storage.load just loads existing records from the fs
// we don't need to wait for it in order to use the storage, so we don't wait for it
// to start the add-on and we don't consider it fatal if it fails

// @TODO: path
storage.load('./localFiles', function(err) {
	if (err) console.log(err)

	// Start indexing

	// Storage: contains a hash map by filePath and another one by itemId; both point to entry objects (an array of files)
	// Indexing: 

	const findFiles = require('./lib/findFiles')
	const indexer = require('./lib/indexer')

	findFiles().on('file', function(fPath) {
		if (storage.byFilePath.has(fPath)) {
			console.log('-> '+fPath+' already indexed')
			return
		}
		
		// @TODO: consider promise
		indexer.indexFile(fPath, function(err, res) {
			if (err) {
				console.log(err)
				return
			}

			if (res) storage.saveEntry(fPath, res, function(err) {
				if (err) console.log(err)
			})
		})
	})
})