const addonSDK = require('stremio-addon-sdk')

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

	idProperty: ['local:', 'bittorrent:'],

	// @TODO: search?
	catalogs: [
		{ type: 'movie', id: 'local' },
		{ type: 'series', id: 'local' }
	]
})

// Constants
const PAGE_SIZE = 100

addon.defineCatalogHandler(function(args, cb) {
	// @TODO
})

addon.defineMetaHandler(function(args, cb) {
	// @TODO
})

addon.run()

// Start indexing
// @TODO: indexer, queue
const findFiles = require('./lib/findFiles')

findFiles().on('file', function(fPath) {
	if (fPath.match('\.torrent$')) indexTorrent(fPath)
})

function indexTorrent(fPath) {
	console.log(fPath)
}