/*
 * Copyright 2021 Mia srl
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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
  const connectionCreated = (address) => setAddressMap(address, 'created', true)
  const connectionReady = (address) => setAddressMap(address, 'ready', true)
  const connectionLost = (address) => {
    setAddressMap(address, 'created', false)
    setAddressMap(address, 'ready', false)
  }

  const isReady = () => Object.values(addressConnectionMap).some(({ ready, created }) => ready && created)

  client.on('connectionCreated', ({ address }) => connectionCreated(address))

  client.on('connectionReady', ({ address }) => connectionReady(address))

  client.on('connectionClosed', ({ address }) => connectionLost(address))

  client.on('serverHeartbeatFailed', ({ connectionId }) => connectionLost(connectionId))

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
