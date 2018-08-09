const fetch = require('node-fetch')

const indexer = require('./indexer')
const mapEntryToMeta = require('./mapEntryToMeta')

const PREFIX_BT = require('./consts').PREFIX_BT

function metaHandler(storage, engineUrl, args, cb) {
	const entry = storage.getAggrEntry(args.id)

	if (entry) {
		// Saved entry is found
		mapEntryToMeta(engineUrl, entry, function(err, meta) {
			cb(err, meta ? { meta: meta } : null)
		})
	} else if (args.id.indexOf(PREFIX_BT) === 0) {
		// Saved entr is not found, but we can make an entry from a torrent
		getNonIndexedTorrent(engineUrl, args.id.slice(PREFIX_BT.length), cb)
	} else {
		cb(new Error('entry not found'))
	}
}

function getNonIndexedTorrent(engineUrl, ih, cb) {
	fetch(engineUrl+'/'+ih+'/create', { method: 'POST' })
	.then(function(resp) { return resp.json() })
	.then(function(resp) {
		indexer.indexParsedTorrent(resp, function(err, entry) {
			if (err) return cb(err)
			if (!entry) return cb(new Error('internal err: no entry from indexParsedTorrent'))

			mapEntryToMeta(engineUrl, entry, function(err, meta) {
				cb(err, meta ? { meta: meta } : null)
			})
		})
	})
	.catch(cb)
}

module.exports = metaHandler