const consts = require('./consts')

const pkg = require('../package')

module.exports = {
	id: 'org.stremio.local',
	version: pkg.version,
	description: pkg.description,

	name: 'Local Files',

	// Properties that determine when Stremio picks this add-on
	resources: ['catalog', 'meta'],
	types: ['movie', 'series', 'other'],

	idPrefixes: [consts.PREFIX_BT, consts.PREFIX_LOCAL, consts.PREFIX_IMDB],

	// @TODO: search?
	catalogs: [
		{ type: 'other', id: 'local' },
	]
}