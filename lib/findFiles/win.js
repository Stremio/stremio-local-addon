const child = require('child_process')
const byline = require('byline')
const events = require('events')

const psScript = `
$sql = "SELECT System.ItemPathDisplay FROM SYSTEMINDEX WHERE System.fileExtension  = '.torrent' or System.FileExtension = '.mp4' or System.FileExtension = '.mkv' or System.FileExtension = '.avi'"
$connector = New-Object -ComObject ADODB.Connection
$rs = New-Object -ComObject ADODB.Recordset
$connector.Open("Provider=Search.CollatorDSO;Extended Properties='Application=Windows';")
$rs.Open($sql, $connector)
$dataset = new-object system.data.dataset
While(-Not $rs.EOF){
 $rs.Fields.Item("System.ItemPathDisplay").Value
 $rs.MoveNext()
}
`

function findFilesWin() {
	const ev = new events.EventEmitter()

	var propsProc = child.spawn('powershell', [ '-command', psScript ])

	propsProc.stdout.pipe(byline()).on('data', function(line) {
		ev.emit('file', line.toString().trim())
	})

	propsProc.stderr.on('data', function(chunk) {
		console.log('powershell search: '+chunk.toString())
	})

	propsProc.on('close', function() {
		// @TODO
	})

	return ev
}

module.exports = findFilesWin