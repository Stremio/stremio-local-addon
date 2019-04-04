const child = require('child_process')
const byline = require('byline')
const events = require('events')

const psScript = `
[console]::InputEncoding = [console]::OutputEncoding = New-Object System.Text.UTF8Encoding
$sql = "SELECT System.ItemUrl,System.DateModified FROM SystemIndex WHERE scope='file:' AND (System.Kind IS Null OR System.Kind = 'Video') AND System.FileAttributes <> ALL BITWISE 0x2 AND NOT System.ItemUrl LIKE '%/Program Files%' AND NOT System.ItemUrl LIKE '%/.%' AND NOT System.ItemUrl LIKE '%/SteamLibrary/%' AND NOT System.ItemUrl LIKE '%/node_modules/%' AND (System.fileExtension = '.torrent' OR System.FileExtension = '.mp4' OR System.FileExtension = '.mkv' OR System.FileExtension = '.avi')"
$connector = New-Object -ComObject ADODB.Connection
$rs = New-Object -ComObject ADODB.Recordset
$connector.Open("Provider=Search.CollatorDSO;Extended Properties='Application=Windows';DateTimeFormat=Ticks;")
$rs.Open($sql, $connector)
While (-Not $rs.EOF) {
    $pos = $rs.Fields.Item("System.ItemUrl").Value.IndexOf(":")
    ConvertTo-Json -Compress @{
        filePath = $rs.Fields.Item("System.ItemUrl").Value.Substring($pos + 1)
        dateModified = $rs.Fields.Item("System.DateModified").Value.toString("o")
    }
    $rs.MoveNext()
}
`

function findFilesWin() {
	const ev = new events.EventEmitter()

	var propsProc = child.spawn('powershell', [ '-command', psScript ])

	propsProc.on('error', function(err) {
		ev.emit('err', err)
	})

	propsProc.stdout.pipe(byline()).on('data', function(line) {
		var fileData = JSON.parse(line.toString())
		ev.emit('file', fileData.filePath, fileData)
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
