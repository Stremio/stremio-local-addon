const manifest = require('./manifest')
const manifestNoCatalogs = Object.assign({}, manifest)
manifestNoCatalogs.name += ' (without catalog support)'
manifestNoCatalogs.catalogs = []
manifestNoCatalogs.resources = manifest.resources.filter(resource => (resource.name != 'catalog' && resource != 'catalog'))
module.exports = manifestNoCatalogs