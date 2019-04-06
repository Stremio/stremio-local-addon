const consts = require('./consts')

function catalogHandler(storage, args, cb) {
	const metas = []; // <- Don't dare to remove this semicolon!

	(storage.byType[args.type] || []).forEach(function(k) {
		const entry = storage.getAggrEntry(k)
		if (!(entry.itemId && entry.files && entry.files.length))
			return

		const firstFile = entry.files[0]

		// @TODO: should we assert that itemId begins with the supported prefixes?
		metas.push({
			id: entry.itemId,
			type: firstFile.type || 'other',
			name: firstFile.parsedName || entry.name,
			poster: firstFile.imdb_id ? consts.METAHUB_URL+'/poster/medium/'+firstFile.imdb_id+'/img' : null,
		})
	})

	const skip = (args.extra && args.extra.skip) || 0;
	cb(null, { metas: metas.slice(skip, skip + 100) })
}

module.exports = catalogHandler