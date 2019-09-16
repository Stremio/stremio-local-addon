const os = require('os')
const crypto = require('crypto')
const path = require('path')

const Storage = require('../lib/storage')

const tmpPath = path.join(os.tmpdir(), 'storage'+crypto.randomBytes(4).readUInt32LE(0))

const tape = require('tape')

let storage1
let storage2

tape('storage: can construct', function(t) {
	storage1 = new Storage({entryIndexes: ['itemId']})
	t.ok(storage1, 'object returned')
	t.ok(storage1.indexes.primaryKey, 'indexes.primaryKey exists')
	t.end()
})

tape('storage: can load an empty storage', function(t) {
	storage1.load(tmpPath)
	.catch(function(err) {
		t.error(err)
	})
	.then(function(err) {
		t.end()
	})
})


function checkAllData(t, storage) {
	t.equals(storage.indexes.primaryKey.size, 3)
	t.equals(storage.indexes.primaryKey.get('/file/test1').itemId, 'test1')
	t.equals(storage.indexes.primaryKey.get('/file/test2').itemId, 'test2')
	t.equals(storage.indexes.primaryKey.get('/file/test2-2').itemId, 'test2')

	const f2 = { path: '/file/test2', name: 'test\nt' }
	const f22 = { path: '/file/test2-2', name: 'test\nt\nt' }
	t.deepEqual(storage.indexes.itemId.get('test2').get('/file/test2'),
		 { itemId: 'test2', files: [f2] }
	)
	t.deepEqual(storage.indexes.itemId.get('test2').get('/file/test2-2'),
		 { itemId: 'test2', files: [f22] }
	)
	t.deepEqual(storage.getAggrEntry('itemId', 'test2', ['files']), {
		itemId: 'test2',
		files: [f2, f22]
	})
}

tape('storage: can persist', function(t) {
	storage1.saveEntry('/file/test1', { itemId: 'test1', files: [{ path: '/file/test1' }] }, function(err) {
		t.error(err)

		let pending = 2
		storage1.saveEntry('/file/test2', { itemId: 'test2', files: [{ path: '/file/test2', name: 'test\nt' }] }, function(err) {
			t.error(err)
			if (--pending === 0) {
				checkAllData(t, storage1)
				t.end()
			}
		})
		storage1.saveEntry('/file/test2-2', { itemId: 'test2', files: [{ path: '/file/test2-2', name: 'test\nt\nt' }] }, function(err) {
			t.error(err)
			if (--pending === 0) {
				checkAllData(t, storage1)
				t.end()
			}
		})
	})
})



tape('storage: can load', function(t) {
	storage2 = new Storage({entryIndexes: ['itemId']})
	storage2.load(tmpPath)
	.catch(function(err) {
		t.error(err)
	})
	.then(function(err) {
		checkAllData(t, storage2)
		t.end()
	})
})