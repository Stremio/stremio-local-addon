#!/usr/bin/env node

const localAddon = require('..')

localAddon.addon.run()

localAddon.startIndexing('./localFiles')
