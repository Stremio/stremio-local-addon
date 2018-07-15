const child = require('child_process')
const events = require('events')
const byline = require('byline')
const which = require('which')

const cmdLine = [
	'-L',
	process.env.HOME+'/Downloads/',
	'-type', 'f',
	'(',
	// @WARNING: when a new file that we look for is added, we have to update all platform-specific finders individually
	'-iname', '*.torrent',
	'-o','-iname', '*.mp4',
	'-o', '-iname', '*.mkv',
	'-o', '-iname', '*.avi',
	')',
]

function findFilesUnix() {
	const ev = new events.EventEmitter()
	setImmediate(startIndexing.bind(ev))
	return ev
}

function startIndexing() {
	var ev = this

	const findPath = which.sync('find')

	if (!findPath) {
		ev.emit('err', 'find executable not found in PATH')
		return
	}

	// @TODO: pipe stderr
	// @TODO: re-index every 30 mins or so?
	// @TODO: consider inotify/dir watching to react to new files

	var p = child.spawn(findPath, cmdLine)

	p.on('error', function(err) {
		ev.emit('err', err)
	})
	
	p.stdout.pipe(byline()).on('data', function(line) {
		ev.emit('file', line.toString().trim())
	})
}

module.exports = findFilesUnix
