const nameToImdb = require('name-to-imdb')
const videoNameParser = require('video-name-parser')
const parseTorrent = require('parse-torrent')
const fs = require('fs')

function indexFile(fPath, cb) {
	if (fPath.match('\.torrent$')) indexTorrent(fPath, cb)
	else cb(null)	
}

function indexTorrent(fPath, cb) {
	fs.readFile(fPath, function(err, buf) {
		if (err) return cb(err)

		console.log(parseTorrent(buf).name)
	})
}

module.exports = { indexFile }