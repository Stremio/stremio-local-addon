const parseTorrent = require('parse-torrent')
const fs = require('fs')

const mapTorrentToMeta = require('../mapTorrentToMeta')

function indexFile(fPath, cb) {
	if (fPath.match('\.torrent$')) indexTorrent(fPath, cb)
	else cb(null)	
}

function indexTorrent(fPath, cb) {
	fs.readFile(fPath, function(err, buf) {
		if (err) return cb(err)

		// @TODO
		mapTorrentToMeta(parseTorrent(buf), function(err, resp) {
			console.log(err, resp)
		})
	})
}

module.exports = { indexFile }