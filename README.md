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

# Framework integration

## Fastify

When you whish to integrate the mongodb-healthchecker library with the [fastify](https://github.com/fastify/fastify) framework you can use `fastify-mongodb` and `fastify-plugin` to help you out in setting up the healthchecker.

[Keep in mind there's an open issue on fastify integration](https://github.com/mia-platform/mongodb-healthchecker/issues/1) that may impact services using `isReady` due to fastify delay in plugin registration.

The suggested way to integrate the library right now is to just use the `isUp` function, see below:

```javascript
const fastifyMongodb = require('fastify-mongodb')
const fp = require('fastify-plugin')
const mongoDBHealthChecker = require('@mia-platform/mongodb-healthchecker')

....

const fastify = new Fastify(...)

fastify
  .register(fastifyMongodb, {
    url: MONGODB_URL,
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .register(fp(async function setupMongoDBHealthChecker(fastify) {
    const { isUp } = mongoDBHealthChecker(fastify.mongo.client)
    fastify.decorate('mongoDBCheckIsUp', isUp)
  }))
```


[npmjs-svg]: https://img.shields.io/npm/v/@mia-platform/mongodb-healthchecker.svg?logo=npm
[npmjs-com]: https://www.npmjs.com/package/@mia-platform/mongodb-healthchecker

