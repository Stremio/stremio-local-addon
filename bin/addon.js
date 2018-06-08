#!/usr/bin/env node

const localAddon = require('..')

localAddon.addon.run()

// @TODO: proper path
localAddon.startIndexing('./localFiles')