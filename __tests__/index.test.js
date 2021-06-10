'use strict'

const { MongoClient } = require('mongodb')

const MONGODB_URL = `mongodb://${process.env.MONGO_HOST}/`

const mongodbHealthChecker = require('..')

const REPL1_MONGODB_ADDRESS = 'repl1'

const getMongoClientMock = () => {
  const mongoEvents = {}
  const mockCommand = jest.fn()
  return {
    client: {
      on: (eventName, callback) => {
        mongoEvents[eventName] = callback
      },
      db: () => ({ command: mockCommand }),
    },
    simulate: (eventName, event) => {
      mongoEvents[eventName](event)
    },
    mockCommand,
  }
}

describe('isReady', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns false if no connection is ready', async() => {
    const { client } = getMongoClientMock()
    const { isReady } = mongodbHealthChecker(client)
    expect(isReady).not.toBeFalsy()
    const readyState = await isReady()
    expect(readyState).toBe(false)
  })

  it('returns false if a connection has been created but is not ready', async() => {
    const { client, simulate } = getMongoClientMock()
    const { isReady } = mongodbHealthChecker(client)

    simulate('connectionCreated', { address: REPL1_MONGODB_ADDRESS })

    const readyState = await isReady()
    expect(readyState).toBe(false)
  })

  it('returns true if a connection has been established', async() => {
    const { client, simulate } = getMongoClientMock()
    const { isReady } = mongodbHealthChecker(client)

    simulate('connectionCreated', { address: REPL1_MONGODB_ADDRESS })
    simulate('connectionReady', { address: REPL1_MONGODB_ADDRESS })

    const readyState = await isReady()
    expect(readyState).toBe(true)
  })

  it('returns false after connectionClose', async() => {
    const { client, simulate } = getMongoClientMock()
    const { isReady } = mongodbHealthChecker(client)

    simulate('connectionCreated', { address: REPL1_MONGODB_ADDRESS })
    simulate('connectionReady', { address: REPL1_MONGODB_ADDRESS })
    simulate('connectionClosed', { address: REPL1_MONGODB_ADDRESS })

    const readyState = await isReady()
    expect(readyState).toBe(false)
  })

  it('returns false after serverHeartbeatFailed', async() => {
    const { client, simulate } = getMongoClientMock()
    const { isReady } = mongodbHealthChecker(client)

    simulate('connectionCreated', { address: REPL1_MONGODB_ADDRESS })
    simulate('connectionReady', { address: REPL1_MONGODB_ADDRESS })
    simulate('serverHeartbeatFailed', { connectionId: REPL1_MONGODB_ADDRESS })

    const readyState = await isReady()
    expect(readyState).toBe(false)
  })
})

describe('isUp', () => {
  let client

  beforeEach(async() => {
    jest.clearAllMocks()

    client = new MongoClient(MONGODB_URL, { useNewUrlParser: true, useUnifiedTopology: true })
    await client.connect()
  })

  afterEach(async() => {
    await client.close()
  })

  it('is not up if not connected', async() => {
    const caseClient = new MongoClient(MONGODB_URL, { useNewUrlParser: true, useUnifiedTopology: true })

    const { isUp } = mongodbHealthChecker(caseClient)
    const upState = await isUp()
    expect(upState).toBe(false)
  })

  it('is up when client connects', async() => {
    const { isUp } = mongodbHealthChecker(client)
    const upState = await isUp()
    expect(upState).toBe(true)
  })

  it('is no more up if client disconnects', async() => {
    const { isUp } = mongodbHealthChecker(client)
    const firstUpState = await isUp()
    expect(firstUpState).toBe(true)

    await client.close()
    const secondUpState = await isUp()
    expect(secondUpState).toBe(false)
  })

  it('is not up if client returns ok != 1', async() => {
    const mongoMocker = getMongoClientMock()
    mongoMocker.mockCommand.mockResolvedValue({ ok: 0 })

    const { isUp } = mongodbHealthChecker(mongoMocker.client)
    const upState = await isUp()
    expect(upState).toBe(false)
  })

  it('is not up if client returns unknown response to ping command', async() => {
    const mongoMocker = getMongoClientMock()
    mongoMocker.mockCommand.mockResolvedValue({ ko: 33 })

    const { isUp } = mongodbHealthChecker(mongoMocker.client)
    const upState = await isUp()
    expect(upState).toBe(false)
  })

  it('is not up if client throws on ping command', async() => {
    const mongoMocker = getMongoClientMock()
    mongoMocker.mockCommand.mockRejectedValue({ someError: 42 })

    const { isUp } = mongodbHealthChecker(mongoMocker.client)
    const upState = await isUp()
    expect(upState).toBe(false)
  })
})
