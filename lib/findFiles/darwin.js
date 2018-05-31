const child = require('child_process')
const byline = require('byline')
const events = require('events')

const cmd = `mdfind '(kMDItemFSName=*.avi || kMDItemFSName=*.mp4 || kMDItemFSName=*.mkv || kMDItemFSName=*.torrent)`

// "&& kMDItemFSContentChangeDate >= $time.today(-1)'" 

function findFilesDarwin() {
	const ev = new events.EventEmitter()

	var p = child.exec(cmd)

	p.on('error', function(err) {
		ev.emit('err', err)
	})
	
	p.stdout.pipe(byline()).on('data', function(line) {
		ev.emit('file', line.toString().trim())
	})

	return ev
}

module.exports = findFilesDarwin