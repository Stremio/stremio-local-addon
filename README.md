# stremio-local-addon

An add-on for stremio meant to be ran locally which indexes locally found torrent and video files

It does a few things:

* Scans the filesystem for video files (currently `mp4`, `mkv`, `avi` and others - depends on the implementation in `lib/findFiles`) and `torrent` files containing videos
* Tries to recognize video files as entertainment content and associate them with an IMDB ID
* Presents a `catalog` to Stremio containing all the found items, where IMDB-recognized video files are grouped by IMDB ID and torrents are grouped by BitTorrent infohash; non-recognized video files are omitted
* Allows Stremio to open any BitTorrent infoHash using `/meta/bt:<infoHash>` request to this add-on


## Data structure

The data is kept in an set (dictionary) of entries (`filePath=>entry`). Each entry represents one file on the filesystem.

Each entry is defined by `{ itemId, name, files }`. When the entry represents a `filePath` of no interest (not an indexable video), we just save `{ files: [] }`. Entries may contain other extra properties such as the Bittorrent-specific `ih` and `sources`.

The reason `files` is an array is that one file on the filesystem may contain multiple indexable videos (e.g. a `.torrent` file).

## itemId

`itemId` is the stremio metadata ID this entry corresponds to.


## Storage

The persistence layer is defined in `lib/storage`, and it keeps each entry as one line in the storage file. Entries may only be added to the storage file, and no entries may be removed.

It allows referencing entries by file path (`.byFilePath`) or by item ID (`.byItemId`). There may be more than one entry per item ID.

The in-memory structure is as follows

`byFilePath`: `filePath=>entry`

`byItemId`: `itemId=>(filePath=>entry)`

Finally, we have the `storage.getAggrEntry` function, which gives us an aggregate entry for an `itemId`, by taking all entries for the given `itemId` and merging them by concatting `files` and taking the leftmost values of the other properties (`name`, `ih`, `sources`).

## Testing

``PORT=1222 npm start``

``npm test``