const METAHUB_URL = 'https://images.metahub.space'

function mapToCatalog(storage, args, cb) {
	const metas = []

	storage.byItemId.forEach(function(v, k) {
		const entry = storage.getAggrEntry(k)
		if (!(entry.itemId && entry.files && entry.files.length))
			return

		const firstFile = entry.files[0]
		
		// @TODO: should we assert that itemId begins with the supported prefixes?
		metas.push({
			id: entry.itemId,
			type: 'other',
			name: firstFile.parsedName || entry.name,
			poster: firstFile.imdb_id ? METAHUB_URL+'/poster/medium/'+firstFile.imdb_id+'/img' : null,
		})
	})

	cb(null, { metas: metas })
}

module.exports = mapToCatalog