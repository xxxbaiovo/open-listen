import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import vm from 'node:vm'

const repo = fileURLToPath(new URL('../../../', import.meta.url))
const load = (relative, context, names) => {
  const source = stripTypeScriptTypes(readFileSync(path.join(repo, relative), 'utf8'), { mode: 'strip' })
    .replace(/^[ \t]*import .*\r?\n/gm, '')
    .replace(/^export default .*\r?\n?/gm, '')
    .replace(/^export /gm, '')
    .replaceAll('import.meta.env.VITE_IS_DESKTOP', 'false')
  return vm.runInNewContext(`${source}\n;({${names.join(',')}})`, context, { filename: relative })
}
const { defaultSetting } = load('packages/shared/common/defaultSetting.ts', {}, ['defaultSetting'])
const { normalizePlayback } = load('packages/view-main/src/modules/setting/retiredPlayback.ts', { defaultSetting }, ['normalizePlayback'])
const retiredKeys = Object.keys(defaultSetting).filter((key) => key === 'player.playbackRate' || key === 'player.preservesPitch' || key.startsWith('player.soundEffect.'))
const snapshot = (value) => JSON.parse(JSON.stringify(value))
const altered = (value) => typeof value === 'boolean' ? !value : typeof value === 'number' ? value + 7 : 'legacy-effect.wav'
const legacySettings = () => ({
  ...defaultSetting,
  ...Object.fromEntries(retiredKeys.map((key) => [key, altered(defaultSetting[key])])),
  'common.langId': 'zh-cn',
  'player.volume': 0.37,
  'player.isMute': true,
  'player.togglePlayMethod': 'singleLoop',
  'player.playQuality': 'flac',
  'player.isShowLyricTranslation': true,
  'playDetail.isDynamicBackground': false,
  'playDetail.style.align': 'right',
  'desktopLyric.enable': true,
  'theme.id': 'grey',
})

test('all saved speed, pitch and sound-effect keys reset to actual repository defaults', () => {
  assert.ok(retiredKeys.length > 10)
  const input = Object.freeze(legacySettings())
  const before = snapshot(input)
  const normalized = normalizePlayback(input)
  for (const key of retiredKeys) assert.equal(normalized[key], defaultSetting[key], key)
  assert.equal(normalized['player.playbackRate'], 1)
  assert.equal(normalized['player.soundEffect.panner.enable'], false)
  assert.equal(normalized['player.soundEffect.convolution.fileName'], '')
  assert.equal(normalized['player.soundEffect.convolution.sendGain'], 0)
  assert.equal(normalized['player.soundEffect.pitchShifter.playbackRate'], 1)
  assert.deepEqual(snapshot(input), before)
  assert.notEqual(normalized, input)
})

test('normalization preserves unrelated playback, lyrics, appearance and all other keys', () => {
  const input = legacySettings()
  const normalized = normalizePlayback(input)
  for (const key of Object.keys(input).filter((key) => !retiredKeys.includes(key))) {
    assert.equal(normalized[key], input[key], key)
  }
  assert.deepEqual(Object.keys(normalized).sort(), Object.keys(input).sort())
})

test('partial and empty updates contain only fields supplied by the caller', () => {
  const partial = Object.freeze({ 'player.playbackRate': 1.75, 'theme.id': 'grey' })
  assert.deepEqual(snapshot(normalizePlayback(partial)), { 'player.playbackRate': 1, 'theme.id': 'grey' })
  assert.deepEqual(snapshot(normalizePlayback({ 'player.volume': 0.2 })), { 'player.volume': 0.2 })
  assert.deepEqual(snapshot(normalizePlayback({ 'player.soundEffect.biquadFilter.hz1000': -12 })), { 'player.soundEffect.biquadFilter.hz1000': 0 })
  assert.deepEqual(snapshot(normalizePlayback({})), {})
  assert.equal(Object.hasOwn(normalizePlayback(partial), 'player.preservesPitch'), false)
})

test('normalization is idempotent', () => {
  const once = normalizePlayback(legacySettings())
  assert.deepEqual(snapshot(normalizePlayback(once)), snapshot(once))
})

const loadCommit = () => {
  const settingState = { setting: { ...defaultSetting } }
  const events = []
  const settingEvent = {
    inited: () => events.push({ name: 'inited' }),
    updated: (keys, setting) => events.push({ name: 'updated', keys: [...keys], setting: snapshot(setting) }),
  }
  const commit = load('packages/view-main/src/modules/setting/store/commit.ts', { normalizePlayback, settingState, settingEvent }, ['initSetting', 'updateSetting'])
  return { commit, settingState, events }
}

test('store initialization publishes normalized settings before consumers receive the event', () => {
  const h = loadCommit()
  const input = Object.freeze(legacySettings())
  h.commit.initSetting(input)
  assert.deepEqual(h.events.map((event) => event.name), ['inited', 'updated'])
  for (const key of retiredKeys) assert.equal(h.settingState.setting[key], defaultSetting[key], key)
  assert.equal(h.events[1].setting['player.volume'], 0.37)
  assert.equal(h.events[1].setting['playDetail.isDynamicBackground'], false)
  assert.equal(input['player.playbackRate'], 8)
})

test('remote partial imports are neutralized in both state and notification without changing input', () => {
  const h = loadCommit()
  h.settingState.setting['player.volume'] = 0.37
  h.settingState.setting['playDetail.isDynamicBackground'] = false
  const partial = Object.freeze({
    'player.playbackRate': 0.5,
    'player.soundEffect.panner.enable': true,
    'player.soundEffect.biquadFilter.hz1000': 12,
    'player.isShowLyricRoma': true,
  })
  const keys = Object.freeze(Object.keys(partial))
  h.commit.updateSetting(keys, partial)
  assert.equal(h.settingState.setting['player.playbackRate'], 1)
  assert.equal(h.settingState.setting['player.soundEffect.panner.enable'], false)
  assert.equal(h.settingState.setting['player.soundEffect.biquadFilter.hz1000'], 0)
  assert.equal(h.settingState.setting['player.volume'], 0.37)
  assert.equal(h.settingState.setting['playDetail.isDynamicBackground'], false)
  assert.equal(h.settingState.setting['player.isShowLyricRoma'], true)
  assert.deepEqual(h.events[0].keys, [...keys])
  assert.deepEqual(Object.keys(h.events[0].setting), [...keys])
  assert.equal(h.events[0].setting['player.playbackRate'], 1)
  assert.equal(partial['player.playbackRate'], 0.5)
  assert.equal(partial['player.soundEffect.panner.enable'], true)
})

const loadInitializer = (saved) => {
  const persisted = []
  const displayed = []
  const module = load('packages/view-main/src/modules/setting/init.ts', {
    normalizePlayback,
    getSetting: async () => saved,
    updateSetting: async (value) => persisted.push(snapshot(value)),
    overwriteSetting: (value) => displayed.push(snapshot(value)),
    i18n: { availableLocales: ['zh-cn'] },
    getEnvLocale: () => 'zh-cn',
    createUnsubscriptionSet: () => ({}),
  }, ['init'])
  return { init: module.init, persisted, displayed }
}

test('startup persists only changed retired defaults and immediately displays normalized settings', async () => {
  const saved = Object.freeze(legacySettings())
  const before = snapshot(saved)
  const h = loadInitializer(saved)
  await h.init()
  assert.equal(h.persisted.length, 1)
  assert.deepEqual(Object.keys(h.persisted[0]).sort(), [...retiredKeys].sort())
  for (const key of retiredKeys) assert.equal(h.persisted[0][key], defaultSetting[key], key)
  assert.equal(h.displayed.length, 1)
  assert.equal(h.displayed[0]['player.playbackRate'], 1)
  assert.equal(h.displayed[0]['player.volume'], 0.37)
  assert.equal(h.displayed[0]['playDetail.isDynamicBackground'], false)
  assert.deepEqual(snapshot(saved), before)
})

test('already normalized startup does not write settings again', async () => {
  const saved = Object.freeze(normalizePlayback(legacySettings()))
  const h = loadInitializer(saved)
  await h.init()
  assert.equal(h.persisted.length, 0)
  assert.deepEqual(h.displayed[0], snapshot(saved))
})
