'use strict'

/**
 * connectionChecker takes a connected MongoDB client and listens to specific events to infer
 * connection status.
 * Note: the library is meant to be used for clients connected to a MongoDB ReplicaSet cluster using
 * MongoDB official driver with unified topology enabled.
 *
 * Returned objects holds two utility functions, `isUp` and `isReady` (both returning a simple boolean)
 *
 *  - isReady returns true if and only if a connection has been establised.
 *  - isUp returns true if and only if the connection is usable.
 *
 * Note: When using unified topology the driver always reconnects as soon as the MongoDB cluster is available
 * so there is no need to stop your service if the connection is not up, the `isUp` function is meant to be used
 * to keep track of the MongoDB connection status, not as a means for killing the application.
 *
 * @param {MongoClient} client a MongoClient instance connected to a ReplicaSet with unified topology.
 * @returns {ConnectionHealthChecker} an object with `isUp` and `isReady` functions.
 */
module.exports = function mongodbHealthChecker(client) {
  const addressConnectionMap = {}
  const setAddressMap = (address, prop, val) => {
    addressConnectionMap[address] = {
      ...(addressConnectionMap[address] || {}),
      [prop]: val,
    }
  }
  const isReady = () => Object.values(addressConnectionMap).some(({ ready, created }) => ready && created)

  client.on('connectionCreated', ({ address }) => setAddressMap(address, 'created', true))

  client.on('connectionReady', ({ address }) => setAddressMap(address, 'ready', true))

  client.on('connectionClosed', ({ address }) => {
    setAddressMap(address, 'created', false)
    setAddressMap(address, 'ready', false)
  })

  client.on('serverHeartbeatFailed', ({ connectionId }) => {
    setAddressMap(connectionId, 'created', false)
    setAddressMap(connectionId, 'ready', false)
  })

  return {
    isUp: async() => pingDB(client),
    isReady: async() => isReady(),
  }
}

async function pingDB(client) {
  let isup = false
  try {
    const { ok } = await client.db().command({ ping: 1 })
    isup = ok === 1
  } catch (error) {
    isup = false
  }
  return isup
}
