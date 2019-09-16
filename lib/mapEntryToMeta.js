const fetch = require('node-fetch')
const consts = require('./consts')

function mapEntryToMeta(entry) {

	// We assume that one torrent may have only one IMDB ID for now: this is the only way to a decent UX now
	const imdbIdFile = entry.files.find(function(f) { return f.imdb_id })
	const biggestFileWithName = entry.files.sort((a, b) => b.length - a.length).find(f => f.parsedName);
	const genericMeta = {
		id: entry.itemId,
		type: 'other',
		name: (biggestFileWithName && biggestFileWithName.parsedName) || entry.name,
		showAsVideos: true,
	}

	if (!imdbIdFile) {
		return Promise.resolve(genericMeta)
	}

	// If we have IMDB ID, first we can fill in those, then try to get the actual object from cinemeta
	genericMeta.poster = consts.METAHUB_URL+'/poster/medium/'+imdbIdFile.imdb_id+'/img' 
	genericMeta.background = consts.METAHUB_URL+'/background/medium/'+imdbIdFile.imdb_id+'/img' 
	genericMeta.logo = consts.METAHUB_URL+'/logo/medium/'+imdbIdFile.imdb_id+'/img' 

	return fetch(consts.CINEMETA_URL+'/meta/'+imdbIdFile.type+'/'+imdbIdFile.imdb_id+'.json')
	.then(function(resp) { return resp.json() })
	.then(function(resp) {
		if (!(resp && resp.meta)) throw 'no meta found'
		const interestingFields = [
			'name', 'genre', 'director', 'cast', 'poster', 'description', 'trailers', 'background', 'logo', 'imdbRating', 'runtime', 'genres', 'releaseInfo'
		];
		Object.keys(resp.meta).forEach(key => interestingFields.includes(key) || delete resp.meta[key])
		Object.assign(resp.meta, {
			id: genericMeta.id,
			type: genericMeta.type,
		})
		return resp.meta
	})
	.catch(function(err) {
		// NOTE: not fatal, we can just fallback to genericMeta
		console.log('local-addon', imdbIdFile, err)

		return genericMeta
	})
}

module.exports = mapEntryToMeta
