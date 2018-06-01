
function mapEntryToMeta(entry, cb) {
	var videos = entry.files
	.map(function(f, i) {

		// @TODO: normal files
		var stream = {
			infoHash: entry.ih,
			fileIdx: i,
			id: entry.ih+'/'+i,
			sources: entry.sources
		}

		return {
			id: stream.id,
			// @TODO: thumbnail
			//thumbnail: f.stream.thumbnail,
			title: f.name,
			publishedAt: new Date(), // TODO? fill this with something that makes sense
			stream: stream,
		}
	})

	return {
		id: entry.itemId,
		type: 'other',
		name: entry.name,
		videos: videos,
		showAsVideos: true,
		// @TODO: background
		//background: videos[0] && videos[0].thumbnail, // TODO: largest?
	}
}

module.exports = mapEntryToMeta