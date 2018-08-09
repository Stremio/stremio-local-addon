const fetch = require('node-fetch')

const indexer = require('./indexer')
const mapEntryToMeta = require('./mapEntryToMeta')
const consts = require('./consts')

function metaHandler(storage, engineUrl, args, cb) {
	if (args.id.startsWith(consts.PREFIX_LOCAL)) {
		const entry = storage.getAggrEntry(args.id)
		if (!entry) {
			cb(new Error('entry not found'))
		} else {
			// Saved entry is found
			mapEntryToMeta(engineUrl, entry, function(err, meta) {
				cb(err, meta ? { meta: meta } : null)
			})
		}
	} else if (args.id.startsWith(consts.PREFIX_BT)) {
		// Saved entr is not found, but we can make an entry from a torrent
		getNonIndexedTorrent(engineUrl, args.id.slice(consts.PREFIX_BT.length), cb)
	} else {
		cb(new Error('invalid request prefix for meta resource'))
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