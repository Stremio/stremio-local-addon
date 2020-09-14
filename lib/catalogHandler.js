const consts = require('./consts')

function catalogHandler(storage, metaStorage, args, cb) {
	const metas = []

	storage.indexes.itemId.forEach(function(items, itemId) {
		const entry = storage.getAggrEntry('itemId', itemId, ['files'])
		if (!(entry.itemId && entry.files && entry.files.length))
			return

		const firstFile = entry.files[0]
		
		// @TODO: should we assert that itemId begins with the supported prefixes?
		const meta = metaStorage.indexes.primaryKey.get(entry.itemId)
		metas.push(meta || {
			id: entry.itemId,
			type: 'other',
			name: firstFile.parsedName || entry.name,
			poster: firstFile.imdb_id ? consts.METAHUB_URL+'/poster/medium/'+firstFile.imdb_id+'/img' : null,
		})
	})

	cb(null, { metas: metas })
}

module.exports = catalogHandler