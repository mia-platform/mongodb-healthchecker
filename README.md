<div align="center">

# MongoDB HealthChecker

[![Node.js CI](https://github.com/mia-platform/mongodb-healthchecker/actions/workflows/node.js.yml/badge.svg)](https://github.com/mia-platform/mongodb-healthchecker/actions/workflows/node.js.yml)
[![NPM version][npmjs-svg]][npmjs-com]

</div>

# Purpose

With the advent of the Node MongoDB Official Driver v4 and the forced use of the unified topology the `isConnected` check available in the driver will always return `true`. However you might want to track down whether the connection is actually ready and usable.

# How

By simply importing the library and provide it with a configured MongoDB Client you'll be provided with two functions `isUp` and `isReady` to check whether the connection is available and operate accordingly.

```javascript
const {MongoClient} = require('mongodb')
const mongoDBHealthChecker = require('@mia-platform/mongodb-healthchecker')

const client = new MongoClient(...)
await client.connect()

const { isReady, isUp } = mongoDBHealthChecker(client)

const isConnectionReady = await isReady()
const isConnectionUp = await isUp()
```


[npmjs-svg]: https://img.shields.io/npm/v/@mia-platform/mongodb-healthchecker.svg?logo=npm
[npmjs-com]: https://www.npmjs.com/package/@mia-platform/mongodb-healthchecker

