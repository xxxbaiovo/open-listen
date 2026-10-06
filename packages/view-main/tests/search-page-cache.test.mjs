import assert from 'node:assert/strict'
import test from 'node:test'
import { PageCache, buildMusicRequestKey, buildMusicQueryKey } from '../src/modules/resource/search/music/pageCache.ts'

const create = (options = {}) => new PageCache({ maxPages: 48, ttl: 1000, ...options })
const deferred = () => {
  let resolve, reject
  const promise = new Promise((yes, no) => { resolve = yes; reject = no })
  return { promise, resolve, reject }
}

test('separate pages and artists stay cached, while ordinary search IDs remain compatible', async () => {
  const cache = create()
  let calls = 0
  const key = (page, artist = '') => buildMusicRequestKey('ext.with.dot', 'source', page, 20, 'song', artist)
  const request = (page, artist = '') => cache.request(key(page, artist), buildMusicQueryKey('ext.with.dot', 'source', 20, 'song', artist), 'source', async () => ({ value: ++calls }))
  await request(1).promise
  await request(2).promise
  await request(1, 'another artist').promise
  assert.equal(request(1).result.value, 1)
  assert.equal(request(2).result.value, 2)
  assert.equal(request(1, 'another artist').result.value, 3)
  assert.equal(calls, 3)
  assert.equal(key(1), JSON.stringify({ extId: 'ext.with.dot', source: 'source', page: 1, limit: 20, text: 'song' }))
  assert.notEqual(buildMusicQueryKey('a.b', 'c', 20, 'song', ''), buildMusicQueryKey('a', 'b.c', 20, 'song', ''))
})

test('concurrent consumers share one request and completed hits return their data synchronously', async () => {
  const cache = create()
  const remote = deferred()
  let calls = 0
  const load = () => { calls++; return remote.promise }
  const first = cache.request('page', 'query', 'source', load)
  const second = cache.request('page', 'query', 'source', load)
  assert.equal(first.promise, second.promise)
  await Promise.resolve()
  assert.equal(calls, 1)
  remote.resolve({ total: 42 })
  await first.promise
  assert.deepEqual(cache.request('page', 'query', 'source', load).result, { total: 42 })
  assert.equal(calls, 1)
})

test('LRU capacity and TTL prevent unbounded or stale page storage', async () => {
  let now = 0
  const cache = create({ maxPages: 2, now: () => now })
  const put = (key) => cache.request(key, 'query', 'source', async () => key).promise
  await put('one')
  await put('two')
  cache.get('one')
  await put('three')
  assert.equal(cache.size, 2)
  assert.equal(cache.get('two'), undefined)
  assert.equal(cache.get('one'), 'one')
  now = 1000
  assert.equal(cache.get('one'), undefined)
  assert.equal(cache.latest('query'), undefined)
  assert.equal(cache.size, 0)
})

test('forced reload bypasses in-flight work and its result cannot be overwritten by an older success', async () => {
  const cache = create()
  const old = deferred()
  const fresh = deferred()
  const first = cache.request('page', 'query', 'source', () => old.promise)
  const reload = cache.request('page', 'query', 'source', () => fresh.promise, true)
  assert.notEqual(first.promise, reload.promise)
  fresh.resolve('fresh')
  await reload.promise
  old.resolve('old')
  await first.promise
  assert.equal(cache.get('page'), 'fresh')
  assert.equal(cache.request('page', 'query', 'source', async () => 'newer', true).result, undefined)
})

test('source invalidation removes completed and pending pages without late cache refill', async () => {
  const cache = create()
  const old = deferred()
  await cache.request('other', 'other-query', 'other-source', async () => 'keep').promise
  await cache.request('old-page', 'query', 'source', async () => 'remove').promise
  const pending = cache.request('pending', 'query', 'source', () => old.promise)
  cache.clearScope('source')
  old.resolve('late')
  await pending.promise
  assert.equal(cache.get('pending'), undefined)
  assert.equal(cache.get('old-page'), undefined)
  assert.equal(cache.get('other'), 'keep')
})

test('an older rejection cannot delete a replacement request, and failed requests can retry', async () => {
  const cache = create()
  const old = deferred()
  const fresh = deferred()
  const first = cache.request('page', 'query', 'source', () => old.promise)
  const rejection = assert.rejects(first.promise, /old failure/)
  const replacement = cache.request('page', 'query', 'source', () => fresh.promise, true)
  old.reject(new Error('old failure'))
  await rejection
  assert.equal(cache.request('page', 'query', 'source', async () => 'duplicate').promise, replacement.promise)
  fresh.resolve('fresh')
  await replacement.promise
  await assert.rejects(cache.request('fail', 'query', 'source', async () => { throw new Error('retry') }).promise)
  assert.equal(await cache.request('fail', 'query', 'source', async () => 'retried').promise, 'retried')
})


