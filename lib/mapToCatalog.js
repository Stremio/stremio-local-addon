const METAHUB_URL = 'https://images.metahub.space'

function mapToCatalog(storage, args, cb) {
	const metas = []

	storage.byItemId.forEach(function(v, k) {
		const entry = storage.getAggrEntry(k)

		console.log(entry)
	})

	cb(null, { metas: metas })
}

module.exports = mapToCatalog