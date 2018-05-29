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
		{ type: 'series', id: 'locla' }
	]
})

// Constants
const PAGE_SIZE = 100

// takes function(type, id, cb)
addon.defineCatalogHandler(function(args, cb) {
	// @TODO
})

addon.defineMetaHandler(function(args, cb) {
	// @TODO
})


addon.run()
