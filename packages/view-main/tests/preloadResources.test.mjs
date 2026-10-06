import assert from 'node:assert/strict'
import test from 'node:test'
import { createAudioPreload } from '../src/shared/audioPreload.ts'
import { createResourceRequests } from '../src/shared/resourceRequest.ts'
import { withAbortSignal } from '../../shared/common/abort.ts'

test('foreground reuses the preloaded request and a completed URL', async () => {
  const requests = createResourceRequests(1000, 1000)
  const deferred = Promise.withResolvers()
  let calls = 0
  const load = () => { calls++; return deferred.promise }
  const preload = requests.get('song:320k', load)
  const foreground = requests.get('song:320k', load)
  assert.equal(preload, foreground)
  deferred.resolve('https://audio/song.mp3')
  await preload
  assert.equal(await requests.get('song:320k', load), 'https://audio/song.mp3')
  assert.equal(calls, 1)
  assert.equal(await requests.get('song:flac', async () => 'different-quality'), 'different-quality')
})

test('a timed-out lyric can be retried; its late result cannot replace the retry', async () => {
  const requests = createResourceRequests(1000, 15)
  const old = Promise.withResolvers()
  await assert.rejects(requests.get('lyric', () => old.promise), /timed out/)
  assert.equal(await requests.get('lyric', async () => 'new lyrics'), 'new lyrics')
  old.resolve('stale lyrics')
  await Promise.resolve()
  assert.equal(await requests.get('lyric', async () => 'unexpected'), 'new lyrics')
})

test('refresh supersedes an older URL lookup without deleting the new request', async () => {
  const requests = createResourceRequests(1000, 1000)
  const old = Promise.withResolvers()
  const refreshed = Promise.withResolvers()
  const first = requests.get('song', () => old.promise)
  const second = requests.get('song', () => refreshed.promise, true)
  old.resolve('expired')
  await first
  assert.equal(requests.get('song', async () => 'unexpected'), second)
  refreshed.resolve('fresh')
  await second
  assert.equal(await requests.get('song', async () => 'unexpected'), 'fresh')
})

test('complete audio survives a matching track change and transfers ownership to the player', async () => {
  const cache = createAudioPreload(1024, 1000, async () => new Response('audio-bytes', { headers: { 'content-type': 'audio/mpeg' } }))
  assert.equal(await cache.prepare('next', 'original-url', 'proxy-url'), true)
  cache.cancel('next')
  assert.equal(cache.take('other-url'), null)
  const buffered = cache.take('original-url')
  assert.ok(buffered)
  cache.cancel()
  assert.equal(await (await fetch(buffered.url)).text(), 'audio-bytes')
  assert.equal(cache.take('original-url'), null)
  buffered.release()
  await assert.rejects(fetch(buffered.url))
})

test('switching queues cancels stale audio and keeps only the new candidate', async () => {
  const old = Promise.withResolvers()
  const signals = []
  const cache = createAudioPreload(1024, 1000, async (url, options) => {
    signals.push(options.signal)
    return url === 'old' ? old.promise : new Response('new audio', { headers: { 'content-type': 'audio/mpeg' } })
  })
  const pending = cache.prepare('a', 'old', 'old')
  await cache.prepare('b', 'new', 'new')
  assert.equal(signals[0].aborted, true)
  old.resolve(new Response('late old audio', { headers: { 'content-type': 'audio/mpeg' } }))
  assert.equal(await pending, false)
  assert.equal(cache.take('old'), null)
  const buffered = cache.take('new')
  assert.equal(await (await fetch(buffered.url)).text(), 'new audio')
  buffered.release()
})

test('oversized, partial, and error responses are not playable cached files', async () => {
  for (const response of [new Response('too-large', { headers: { 'content-type': 'audio/mpeg' } }), new Response('part', { status: 206, headers: { 'content-type': 'audio/mpeg' } }), new Response('{}', { headers: { 'content-type': 'application/json' } })]) {
    const cache = createAudioPreload(4, 1000, async () => response)
    assert.equal(await cache.prepare('song', 'url', 'url'), false)
    assert.equal(cache.take('url'), null)
    cache.cancel()
  }
})

test('a stalled provider has a bounded wait and late rejection is handled', async () => {
  const controller = new AbortController()
  const provider = Promise.withResolvers()
  const bounded = withAbortSignal(provider.promise, controller.signal)
  controller.abort(new Error('deadline'))
  await assert.rejects(bounded, /deadline/)
  provider.reject(new Error('late provider failure'))
  await Promise.resolve()
})
