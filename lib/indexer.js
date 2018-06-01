const parseTorrent = require('parse-torrent')
const fs = require('fs')

const mapTorrentToMeta = require('./mapTorrentToMeta')

function indexFile(fPath, cb) {
	if (fPath.match('\.torrent$')) indexTorrent(fPath, cb)
	else cb(null)	
}

function indexTorrent(fPath, cb) {
	fs.readFile(fPath, function(err, buf) {
		if (err) return cb(err)

		// @TODO: mapTorrentToEntry
		mapTorrentToMeta(parseTorrent(buf), function(err, resp) {
			cb(err, { itemId: resp.id, entry: resp })
		})
	})
}

module.exports = { indexFile }