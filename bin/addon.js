#!/usr/bin/env node

const localAddon = require('..')

localAddon.addon().runHTTPWithOptions({ port: process.env.PORT || 1222 })

localAddon.startIndexing('./localFiles')
