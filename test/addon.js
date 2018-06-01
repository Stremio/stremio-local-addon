const tape = require('tape')
const AddonClient = require('stremio-addon-client')

const addonUrl = 'http://127.0.0.1:1222/manifest.json'
const testIh = '7782ab24188091eae3f61fd218b2dffb4bf9cf9c'

let addon

tape('initialize add-on', function(t) {
	return AddonClient.detectFromURL(addonUrl)
	.then(function(resp) {
		t.ok(resp, 'has response')
		t.ok(resp.addon, 'has addon')
		t.ok(resp.addon.manifest.catalogs, 'has catalogs')
		t.ok(resp.addon.manifest.catalogs.length, 'has catalogs length')

		addon = resp.addon

		t.end()
	})
	.catch(function(e) { 
		t.error(e)
		t.end()
	})

})

tape('meta - bittorrent', function(t) {
	addon.get('meta', 'other', 'bt:'+testIh)		
	.then(function(resp) {
		t.ok(resp.meta)
		t.equals(resp.meta.id, 'bt:'+testIh)
		t.ok(Array.isArray(resp.meta.videos), 'has videos')

		console.log(resp.meta)
		// @TODO: more checks, on files too
		t.end()
	})
	.catch(function(e) {
		t.error(e)
		t.end()
	})
})