const consts = require('./consts')

const pkg = require('../package')

module.exports = {
	id: 'org.stremio.local',
	version: pkg.version,
	description: pkg.description,

	name: 'Local Files',

	// Properties that determine when Stremio picks this add-on
	resources: [
		'catalog',
		{ name: 'meta', types: ['other'], idPrefixes: [consts.PREFIX_LOCAL, consts.PREFIX_BT] },
		{ name: 'stream', types: ['movie', 'series'], idPrefixes: [consts.PREFIX_IMDB] },
	],
	types: ['movie', 'series', 'other'],

	// @TODO: search?
	catalogs: [
		{ type: 'other', id: 'local' },
	]
}