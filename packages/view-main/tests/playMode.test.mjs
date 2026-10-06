import assert from 'node:assert/strict'
import test from 'node:test'
import { setImmediate } from 'node:timers'

import { createPlayModeController, createPlaybackOptionsController, readPlaybackOptions, resolvePlaybackMethod, pickShuffleTrack, getNextPlayMode, getPlayModePresentation, PLAY_MODES } from '../src/shared/playMode.ts'

const flush = () => new Promise((resolve) => setImmediate(resolve))

const createPlayer = (initialMode = 'list') => {
  let currentMode = initialMode
  const writes = []
  const controller = createPlayModeController(
    () => currentMode,
    (mode) => {
      const deferred = Promise.withResolvers()
      writes.push({ mode, ...deferred })
      return deferred.promise
    }
  )
  const echo = (mode) => {
    currentMode = mode
    controller.observe(mode)
  }
  return { controller, writes, echo }
}

test('shuffle and three repeat states remain independent during rapid interleaved clicks', async () => {
  let state = { shuffle: false, repeat: 'all' }
  const writes = []
  const controller = createPlaybackOptionsController(() => state, async (next) => {
    await flush()
    writes.push(next)
    state = next
    controller.observe(next)
  })
  await Promise.all([controller.toggleShuffle(), controller.nextRepeat(), controller.nextRepeat(), controller.toggleShuffle(), controller.nextRepeat()])
  assert.deepEqual(writes, [
    { shuffle: true, repeat: 'all' }, { shuffle: true, repeat: 'one' }, { shuffle: true, repeat: 'off' },
    { shuffle: false, repeat: 'off' }, { shuffle: false, repeat: 'all' },
  ])
})

test('saved legacy random mode loads as shuffle plus list repeat', () => {
  assert.deepEqual(readPlaybackOptions('random'), { shuffle: true, repeat: 'all' })
  assert.deepEqual(readPlaybackOptions('singleLoop', true), { shuffle: true, repeat: 'one' })
})

test('natural endings prioritize single repeat; manual skips honor shuffle', () => {
  assert.equal(resolvePlaybackMethod('singleLoop', true, true), 'singleLoop')
  assert.equal(resolvePlaybackMethod('singleLoop', true, false), 'random')
  assert.equal(resolvePlaybackMethod('listLoop', true, true), 'random')
  assert.equal(resolvePlaybackMethod('list', true, true), 'random')
  assert.equal(resolvePlaybackMethod('list', false, true), 'list')
  assert.equal(resolvePlaybackMethod('none', false, true), 'list')
})

test('shuffle without repeat visits the whole playlist once and then stops', () => {
  const list = ['a', 'b', 'c', 'd'].map(itemId => ({ itemId, played: false }))
  let currentId = 'c'
  const visited = [currentId]
  for (let i = 0; i < 4; i++) {
    const next = pickShuffleTrack(list, currentId, 'off', true, () => 0.8)
    if (!next) break
    list.find(track => track.itemId === currentId).played = true
    currentId = next.track.itemId
    visited.push(currentId)
    assert.equal(next.newCycle, false)
  }
  assert.equal(visited.length, 4)
  assert.equal(new Set(visited).size, 4)
  assert.equal(pickShuffleTrack(list, currentId, 'off', true), null)
})

test('list repeat starts a new shuffle cycle without immediately repeating the current song', () => {
  const list = ['a', 'b', 'c'].map(itemId => ({ itemId, played: true }))
  const next = pickShuffleTrack(list, 'c', 'all', true, () => 0.99)
  assert.equal(next.newCycle, true)
  assert.notEqual(next.track.itemId, 'c')
  assert.equal(pickShuffleTrack([list[0]], 'a', 'all', true).track.itemId, 'a')
  assert.equal(pickShuffleTrack([list[0]], 'a', 'off', true), null)
  assert.equal(pickShuffleTrack([], undefined, 'all', true), null)
})

test('cycles through every existing playback mode exactly once', () => {
  assert.deepEqual(PLAY_MODES, ['list', 'listLoop', 'random', 'singleLoop', 'none'])
  for (const start of PLAY_MODES) {
    const visited = []
    let mode = start
    for (let index = 0; index < PLAY_MODES.length; index++) {
      visited.push(mode)
      mode = getNextPlayMode(mode)
    }
    assert.equal(new Set(visited).size, 5)
    assert.equal(mode, start)
  }
})

test('each mode has its existing icon and only repeat/shuffle modes are active', () => {
  assert.deepEqual(PLAY_MODES.map(getPlayModePresentation), [
    { icon: 'list-order', active: false },
    { icon: 'list-loop', active: true },
    { icon: 'list-random', active: true },
    { icon: 'list-single-loop', active: true },
    { icon: 'unavailable', active: false },
  ])
})

test('rapid clicks queue distinct successive modes and serialize persistence', async () => {
  const { controller, writes, echo } = createPlayer()
  const clicks = [controller.next(), controller.next(), controller.next()]
  await flush()
  assert.deepEqual(writes.map((write) => write.mode), ['listLoop'])
  for (const [index, expected] of ['listLoop', 'random', 'singleLoop'].entries()) {
    assert.equal(writes[index].mode, expected)
    echo(expected)
    writes[index].resolve()
    await clicks[index]
    await flush()
  }
  assert.deepEqual(writes.map((write) => write.mode), ['listLoop', 'random', 'singleLoop'])
})

test('the main and lyric player can share a sequence while writes are pending', async () => {
  const { controller, writes, echo } = createPlayer('random')
  const mainPlayerClick = controller.next
  const lyricPlayerClick = controller.next
  const first = mainPlayerClick()
  const second = lyricPlayerClick()
  await flush()
  assert.equal(writes[0].mode, 'singleLoop')
  echo('singleLoop')
  writes[0].resolve()
  await first
  await flush()
  assert.equal(writes[1].mode, 'none')
  echo('none')
  writes[1].resolve()
  await second
})

test('late setting echoes do not rewind the next mode after IPC acknowledgements', async () => {
  const { controller, writes, echo } = createPlayer()
  const first = controller.next()
  await flush()
  writes[0].resolve()
  await first
  const second = controller.next()
  await flush()
  assert.equal(writes[1].mode, 'random')
  writes[1].resolve()
  await second
  echo('listLoop')
  const third = controller.next()
  await flush()
  assert.equal(writes[2].mode, 'singleLoop')
  echo('random')
  writes[2].resolve()
  await third
  echo('singleLoop')
  const fourth = controller.next()
  await flush()
  assert.equal(writes[3].mode, 'none')
  echo('none')
  writes[3].resolve()
  await fourth
})

test('a full cycle retains the last intent until delayed echoes catch up', async () => {
  const { controller, writes, echo } = createPlayer()
  const clicks = Array.from({ length: 5 }, () => controller.next())
  for (let index = 0; index < clicks.length; index++) {
    await flush()
    writes[index].resolve()
    await clicks[index]
  }
  assert.deepEqual(writes.map((write) => write.mode), ['listLoop', 'random', 'singleLoop', 'none', 'list'])
  echo('listLoop')
  const next = controller.next()
  await flush()
  assert.equal(writes[5].mode, 'listLoop')
  for (const mode of ['random', 'singleLoop', 'none', 'list', 'listLoop']) echo(mode)
  writes[5].resolve()
  await next
})

test('a rejected write is reported without poisoning subsequent queued clicks', async () => {
  const { controller, writes, echo } = createPlayer()
  const first = controller.next()
  const failure = assert.rejects(first, /offline/)
  const second = controller.next()
  await flush()
  writes[0].reject(new Error('offline'))
  await failure
  await flush()
  assert.equal(writes[1].mode, 'random')
  echo('random')
  writes[1].resolve()
  await second
})

test('after the final write fails, another click retries from the actual setting', async () => {
  const { controller, writes, echo } = createPlayer()
  const first = controller.next()
  const failure = assert.rejects(first, /offline/)
  await flush()
  writes[0].reject(new Error('offline'))
  await failure
  const retry = controller.next()
  await flush()
  assert.equal(writes[1].mode, 'listLoop')
  echo('listLoop')
  writes[1].resolve()
  await retry
})

test('an idle remote setting change becomes the next click starting point', async () => {
  const { controller, writes, echo } = createPlayer()
  const first = controller.next()
  await flush()
  writes[0].resolve()
  await first
  echo('none')
  const next = controller.next()
  await flush()
  assert.equal(writes[1].mode, 'list')
  echo('list')
  writes[1].resolve()
  await next
})

test('a remote change after the local echo but before acknowledgement becomes the next starting point', async () => {
  const { controller, writes, echo } = createPlayer()
  const first = controller.next()
  await flush()
  assert.equal(writes[0].mode, 'listLoop')
  echo('listLoop')
  echo('random')
  writes[0].resolve()
  await first

  const next = controller.next()
  await flush()
  assert.equal(writes[1].mode, 'singleLoop')
  echo('singleLoop')
  writes[1].resolve()
  await next
})

test('selecting the actual or already queued mode does not add redundant writes', async () => {
  const { controller, writes, echo } = createPlayer()
  await controller.select('list')
  assert.equal(writes.length, 0)
  const selection = controller.select('random')
  await controller.select('random')
  await flush()
  assert.deepEqual(writes.map((write) => write.mode), ['random'])
  echo('random')
  writes[0].resolve()
  await selection
})
