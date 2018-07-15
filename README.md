# stremio-local-addon

An add-on for stremio meant to be ran locally which indexes locally found torrent and video files

It does a few things:

* Scans the filesystem for video files (currently `mp4`, `mkv`, `avi` and others - depends on the implementation in `lib/findFiles`) and `torrent` files containing videos
* Tries to recognize video files as entertainment content and associate them with an IMDB ID
* Presents a `catalog` to Stremio containing all the found items, where IMDB-recognized video files are grouped by IMDB ID and torrents are grouped by BitTorrent infohash; non-recognized video files are omitted
* Allows Stremio to open any BitTorrent infoHash using `/meta/bt:<infoHash>` request to this add-on


## Testing 

``PORT=1222 npm start``

``npm test``