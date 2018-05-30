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

const BT_PREFIX = 'bt:'

const mapTorrentToMeta = require('./lib/mapTorrentToMeta')

addon.defineCatalogHandler(function(args, cb) {
	// @TODO
	// @TODO: return a catalog of all indexed items, sorted by last indexed
	// an item id would either be local:tt<imdbId> or local:bt:IH
})

addon.defineMetaHandler(function(args, cb) {
	// @TODO
	// if args.id begins with 'bt:'

	if (args.id.indexOf(BT_PREFIX) === 0) {
		var ih = args.id.slice(BT_PREFIX.length)

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

addon.run()

// Start indexing
// @TODO: indexer, queue
const findFiles = require('./lib/findFiles')
const indexer = require('./lib/indexer')

findFiles().on('file', function(fPath) {
	// @TODO: consider promise
	indexer.indexFile(fPath, function(err, res) {

	})
})
