import assert from 'node:assert/strict'
import test from 'node:test'

import { getPlaylistDuration } from '../src/shared/playlistDuration.ts'

const tracks = (...intervals) => intervals.map((interval) => ({ interval }))

test('adds real minute-second and hour-minute-second durations together', () => {
  assert.equal(getPlaylistDuration(tracks('03:55', '01:05', '1:02:03')), 4023)
  assert.equal(getPlaylistDuration(tracks('120:30', '02:00:30')), 14460)
  assert.equal(getPlaylistDuration(tracks('9:59', '00:01')), 600)
})

test('accepts zero duration and surrounding whitespace without inventing a minimum', () => {
  assert.equal(getPlaylistDuration(tracks('00:00')), 0)
  assert.equal(getPlaylistDuration(tracks(' 03:55 ', '\t01:05\n')), 300)
})

test('empty playlists and any missing duration have no complete total', () => {
  assert.equal(getPlaylistDuration([]), null)
  for (const interval of [null, undefined, '', '   ', '--/--']) {
    assert.equal(getPlaylistDuration(tracks('03:55', interval, '01:05')), null)
  }
  assert.equal(getPlaylistDuration([{ interval: '03:55' }, {}]), null)
})

test('rejects invalid fields instead of returning the sum of the valid tracks', () => {
  for (const interval of ['03:60', '1:60:00', '1:00:60', '-03:55', '3:5', '1:2:03', '3.5:00', '1e2:00', '1:02:03:04', '03:55junk', 'NaN', 'Infinity', 235]) {
    assert.equal(getPlaylistDuration(tracks('03:55', interval)), null, String(interval))
  }
})

test('rejects totals outside the safe integer range', () => {
  assert.equal(getPlaylistDuration(tracks('150119987579017:00')), null)
  assert.equal(getPlaylistDuration(tracks('75059993789509:00', '75059993789509:00')), null)
})

test('recalculates after metadata arrives without modifying tracks', () => {
  const list = tracks('03:55', null)
  assert.equal(getPlaylistDuration(list), null)
  list[1].interval = '01:05'
  assert.equal(getPlaylistDuration(list), 300)
  assert.deepEqual(list, tracks('03:55', '01:05'))
})
