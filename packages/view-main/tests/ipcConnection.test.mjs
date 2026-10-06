import assert from 'node:assert/strict'
import test from 'node:test'
import { ipc, ipcConnection } from '../src/shared/ipc/connection.ts'

test('reloaded consumers share the initialized playback and library connection', async () => {
  const ownerUrl = new URL('../src/shared/ipc/connection.ts', import.meta.url).href
  const loadConsumer = (generation) => import(`data:text/javascript,${encodeURIComponent(
    `import { ipc, ipcConnection } from ${JSON.stringify(ownerUrl)};
     export const play = (value) => ipc.playListAction(value);
     export const collect = (value) => ipc.listAction(value);
     export const reconnect = (client) => { ipcConnection.client = client; };
     export const service = () => ipcConnection.service;
     // consumer generation ${generation}`
  )}`)
  const calls = []
  const previous = { ...ipcConnection }
  try {
    const first = await loadConsumer(1)
    const service = () => {}
    ipcConnection.service = service
    first.reconnect({
      playListAction: async (value) => calls.push(['play', value]),
      listAction: async (value) => calls.push(['collect', value]),
    })
    await first.play('before update')

    const reloaded = await loadConsumer(2)
    await reloaded.collect('after update')
    await reloaded.play('after update')
    assert.equal(reloaded.service(), service)
    assert.deepEqual(calls, [
      ['play', 'before update'], ['collect', 'after update'], ['play', 'after update'],
    ])

    // An existing connection callback still updates every consumer after reload.
    first.reconnect({ listAction: async () => 'reconnected' })
    assert.equal(await reloaded.collect(), 'reconnected')
  } finally {
    Object.assign(ipcConnection, previous)
  }
})

test('calls before connection give an explicit connection error', () => {
  const previous = ipcConnection.client
  ipcConnection.client = null
  try {
    assert.throws(() => ipc.listAction, /service is not connected/)
  } finally {
    ipcConnection.client = previous
  }
})
