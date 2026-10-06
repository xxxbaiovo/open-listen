import assert from 'node:assert/strict'
import test from 'node:test'

import { createNativeGdSearch, supportsNativeGdSearch } from './gdstudio.ts'

const params = (overrides = {}) => ({ extensionId: 'gdstudio', source: 'gd-netease', name: 'song', page: 1, limit: 20, ...overrides })
const tracks = (count, offset = 0) => Array.from({ length: count }, (_, i) => ({
  id: String(offset + i + 1), name: `Song ${offset + i + 1}`, artist: ['Artist A', 'Artist B'], album: 'Album',
  duration: 235, pic_id: `pic-${offset + i + 1}`, lyric_id: `lyric-${offset + i + 1}`,
}))
const response = (body) => ({ statusCode: 200, body })

test('returns compatible IDs and metadata; page 2 reuses the batch without cover/audio calls', async () => {
  const calls = []
  const search = createNativeGdSearch(async (url, options) => {
    calls.push(new URL(url))
    assert.equal(options.retryNum, 0)
    return response(tracks(60))
  }, () => 123)
  const first = await search(params())
  const second = await search(params({ page: 2 }))
  const back = await search(params())
  assert.equal(calls.length, 1)
  assert.equal(calls[0].searchParams.get('types'), 'search')
  assert.equal(calls[0].searchParams.get('count'), '60')
  assert.equal(second.list[0].id, 'gd:v1:netease:21')
  assert.equal(first.total, 61)
  assert.deepEqual(first, back)
  assert.deepEqual(first.list[0], {
    id: 'gd:v1:netease:1', name: 'Song 1', singer: 'Artist A、Artist B', interval: '03:55', isLocal: false,
    meta: { musicId: '1', albumName: 'Album', source: 'gd-netease', picUrl: null, qualitys: {},
      _picId: 'pic-1', _lyricId: 'lyric-1', _gdResourceVersion: 1, createTime: 123, updateTime: 123, posTime: 123 },
  })
  first.list[0].meta.picUrl = 'caller-local-cover'
  assert.equal((await search(params())).list[0].meta.picUrl, null)
})

test('coalesces simultaneous pages while isolating query, artist and source', async () => {
  const calls = []
  const search = createNativeGdSearch(async (url) => {
    const query = new URL(url).searchParams
    calls.push(query)
    await Promise.resolve()
    return response(tracks(60).map((track) => ({ ...track, name: query.get('name') })))
  })
  const [one, two, other, artist, source] = await Promise.all([
    search(params()), search(params({ page: 2 })), search(params({ name: 'other' })),
    search(params({ artist: 'Singer' })), search(params({ source: 'gd-kuwo' })),
  ])
  assert.equal(calls.length, 4)
  assert.equal(one.list[0].name, 'song')
  assert.equal(two.list[0].id, 'gd:v1:netease:21')
  assert.equal(other.list[0].name, 'other')
  assert.equal(artist.list[0].name, 'song Singer')
  assert.equal(source.list[0].id, 'gd:v1:kuwo:1')
  assert.ok(calls.every((query) => query.get('pages') === '1'))
})

test('empty and repeated upstream batches finish, including a distant page request', async () => {
  let requests = 0
  const search = createNativeGdSearch(async () => { requests++; return response(tracks(20)) })
  const distant = await search(params({ page: 40 }))
  assert.equal(requests, 2)
  assert.deepEqual(distant.list, [])
  assert.equal(distant.total, 20)
  assert.equal((await search(params())).list.length, 20)
  assert.equal(requests, 2)
  const empty = createNativeGdSearch(async () => response([]))
  assert.deepEqual(await empty(params()), { list: [], total: 0, page: 1, limit: 20 })
})

test('expires metadata and bounds the number of cached queries', async () => {
  let clock = 0
  let requests = 0
  const search = createNativeGdSearch(async () => { requests++; return response(tracks(60)) }, () => clock)
  await search(params())
  await search(params())
  assert.equal(requests, 1)
  clock = 5 * 60_000
  await search(params())
  assert.equal(requests, 2)
  for (let i = 0; i < 12; i++) await search(params({ name: `other-${i}` }))
  await search(params())
  assert.equal(requests, 15)
})

test('only incompatible response structures fall back; failures do not repeat the request', async () => {
  assert.equal(await createNativeGdSearch(async () => response({ unexpected: [] }))(params()), undefined)
  assert.equal(await createNativeGdSearch(async () => response([{ name: 'missing id' }]))(params()), undefined)
  let requests = 0
  const search = createNativeGdSearch(async () => { requests++; throw new Error('timeout') })
  await assert.rejects(search(params()), /timeout/)
  assert.equal(requests, 1)
  await assert.rejects(createNativeGdSearch(async () => ({ statusCode: 429, body: [] }))(params()), /HTTP 429/)
  await assert.rejects(createNativeGdSearch(async () => response({ error: 'upstream error' }))(params()), /API returned an error/)
})

test('keeps a partial page on later batch failure, then retries only the failed batch', async () => {
  const pages = []
  const search = createNativeGdSearch(async (url) => {
    const page = new URL(url).searchParams.get('pages')
    pages.push(page)
    if (pages.length === 2) throw new Error('timeout')
    return response(page === '1' ? tracks(10) : tracks(20, 10))
  })
  const partial = await search(params())
  assert.equal(partial.list.length, 10)
  assert.equal(partial.total, 21)
  assert.deepEqual(pages, ['1', '2'])
  const retried = await search(params())
  assert.equal(retried.list.length, 20)
  assert.deepEqual(pages, ['1', '2', '2'])
})

test('only enabled, loaded GDStudio 0.4.3 main sources with internet/search grants qualify', () => {
  const extension = { id: 'gdstudio', version: '0.4.3', enabled: true, loaded: true, removed: false,
    grant: ['internet'], contributes: { resource: [{ id: 'gd-netease', resource: ['musicSearch'] }] } }
  assert.equal(supportsNativeGdSearch(extension, 'gd-netease'), true)
  for (const override of [{ version: '0.4.4' }, { id: 'other' }, { enabled: false }, { loaded: false },
    { removed: true }, { grant: [] }, { contributes: {} }]) {
    assert.equal(supportsNativeGdSearch({ ...extension, ...override }, 'gd-netease'), false)
  }
  assert.equal(supportsNativeGdSearch(extension, 'gd-tencent'), false)
  assert.equal(supportsNativeGdSearch(extension, 'netease'), false)
})
