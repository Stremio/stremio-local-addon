const os = require('os')

const findFilesWin = require('./win')
const findFilesDarwin = require('./darwin')
const findFilesUnix = require('./unix')

// default is unix
let findFiles = findFilesUnix

if (os.platform() === 'win') findFiles = findFilesWin
if (os.platform() === 'darwin') findFiles = findFilesDarwin

module.exports = findFiles
