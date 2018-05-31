const shell = require('node-powershell')
const events = require('events')

var psScript = `
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
	
	//setImmediate(startIndexing.bind(ev))
	//searchProcess = child.spawn(DSPath, [ "/b", "/e", "avi,mp4,mkv,mov,torrent" ].concat(firstImportDone ? ["modified:today"] : []));

	let ps = new shell({
		noProfile: true,
		debugMsg: false,
	})

	ps.addCommand(psScript)
	ps.invoke()

	ps.streams.stdout.on('data', data=>{
		console.log(data)
	});

	return ev
}

module.exports = findFilesWin