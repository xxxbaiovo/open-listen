import assert from 'node:assert/strict'
import test from 'node:test'
import vm from 'node:vm'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { stripTypeScriptTypes } from 'node:module'
import { isValidLyric } from '../../shared/common/lyric.ts'

const repository = fileURLToPath(new URL('../../../', import.meta.url))
const engineDirectory = repository + '/packages/shared/web/lyric-font-player/'
const engineSources = Object.fromEntries(await Promise.all(
  ['utils.js', 'font-player.js', 'line-player.js', 'index.js'].map(async (file) => [file, await readFile(engineDirectory + file, 'utf8')])
))
const moduleSource = stripTypeScriptTypes(await readFile(
  repository + '/packages/view-main/src/modules/lyric/lyric.ts', 'utf8'
))
const withoutImports = (source) => source.replace(/^import .*$/gm, '')

const createHarness = () => {
  let now = 1000
  let nextId = 1
  const frames = new Map()
  const timers = new Map()
  const animations = []
  const events = []
  const state = { lines: [], line: -1, text: '', offset: 0 }
  class FakeElement {
    constructor(tagName) {
      this.tagName = tagName
      this.style = {}
      this.children = []
      this.textContent = ''
      this.classes = new Set()
      this.classList = {
        add: (...names) => names.forEach((name) => this.classes.add(name)),
        remove: (...names) => names.forEach((name) => this.classes.delete(name)),
        contains: (name) => this.classes.has(name),
      }
    }
    set className(value) { this.classes = new Set(value.split(/\s+/).filter(Boolean)) }
    get className() { return [...this.classes].join(' ') }
    appendChild(child) {
      if (child.parent) child.parent.children.splice(child.parent.children.indexOf(child), 1)
      child.parent = this
      this.children.push(child)
      return child
    }
  }
  class FakeAnimation {
    constructor(effect) {
      this.effect = effect
      this.playState = 'idle'
      this.currentTime = null
      this.listeners = new Map()
      animations.push(this)
    }
    play() {
      if (this.currentTime === null) this.currentTime = 0
      this.playState = 'running'
    }
    pause() {
      if (this.currentTime === null) this.currentTime = 0
      this.playState = 'paused'
    }
    cancel() { this.currentTime = null; this.playState = 'idle' }
    addEventListener(name, callback) { this.listeners.set(name, callback) }
  }
  const window = {
    performance: { now: () => now },
    requestAnimationFrame(callback) { const id = nextId++; frames.set(id, callback); return id },
    cancelAnimationFrame(id) { frames.delete(id) },
    setTimeout(callback, delay = 0) { const id = nextId++; timers.set(id, { callback, at: now + delay }); return id },
    clearTimeout(id) { timers.delete(id) },
    Animation: FakeAnimation,
    KeyframeEffect: class { constructor(target, keyframes, options) { Object.assign(this, { target, keyframes, options }) } },
  }
  const context = vm.createContext({
    window, performance: window.performance, document: { createElement: (tag) => new FakeElement(tag), timeline: {} },
    console,
    clearTimeoutBg: window.clearTimeout,
    setTimeoutBg: window.setTimeout,
    settingState: { setting: { 'player.playbackRate': 1 } },
    setLines: (lines) => { state.lines = lines },
    setStoreOffset: (offset) => { state.offset = offset },
    setText: (text, line) => { state.text = text; state.line = line; events.push({ text, line }) },
  })
  const load = (source, result) => vm.runInContext(
    '(function(){' + withoutImports(source).replaceAll('export default class', 'class').replaceAll('export const', 'const')
      .replaceAll('export class', 'class') + '\nreturn ' + result + '\n})()', context
  )
  Object.assign(context, load(engineSources['utils.js'], '{getNow, TimeoutTools}'))
  context.FontPlayer = load(engineSources['font-player.js'], 'FontPlayer')
  context.LinePlayer = load(engineSources['line-player.js'], 'LinePlayer')
  context.Lyric = load(engineSources['index.js'], 'Lyric')
  const api = load(moduleSource, '{initLyric, syncPausedTime, setLyric, setOffset, setPlaybackRate, pause, getEngine: () => lrc}')
  const release = api.initLyric()
  const assertIdle = () => {
    assert.equal(api.getEngine().linePlayer.isPlay, false)
    assert.equal(frames.size, 0, 'lyric engine left a RAF scheduled')
    assert.equal(timers.size, 0, 'lyric engine left a timeout scheduled')
    assert.equal(animations.filter((animation) => animation.playState === 'running').length, 0, 'word animation still running')
  }
  return {
    api, state, events, frames, timers, animations, assertIdle, release,
    advance(milliseconds) {
      now += milliseconds
      const callbacks = [...frames.values()]
      frames.clear()
      for (const callback of callbacks) callback(now)
      for (const [id, timer] of [...timers]) if (timer.at <= now) { timers.delete(id); timer.callback() }
    },
  }
}
const lineLyric = '[00:10.000]First line\n[00:40.000]Middle line\n[01:00.000]Last line'
const wordLyric = '[00:10.000]<0,1000>First <1000,1000>line\n[00:40.000]<0,4000>Middle <4000,4000>word\n[01:00.000]<0,1000>Last <1000,1000>line'

test('invalid provider timestamps are rejected so they cannot block lyric fallback or poison the cache', () => {
  assert.equal(isValidLyric('[00:00.00-1] Credit\n[00:00.00-1] Composer'), false)
  assert.equal(isValidLyric('[00:00.00]'), false)
  assert.equal(isValidLyric('[ar:Artist]\n[00:10]Verse'), true)
  assert.equal(isValidLyric(wordLyric), true)
})

test('timestamps without fractional seconds display and synchronize normally', () => {
  const h = createHarness()
  h.api.setLyric('[00:10]First\n[00:40]Middle\n[01:00]Last', [])
  h.api.syncPausedTime(45000)
  assert.equal(h.state.lines.length, 3)
  assert.equal(h.state.text, 'Middle')
  h.assertIdle()
  h.release()
})

test('paused 45s lyric rebuild restores the active line without leaving work scheduled', () => {
  const h = createHarness()
  h.api.setLyric(lineLyric, [])
  h.api.syncPausedTime(45000)
  assert.equal(h.state.line, 1)
  assert.equal(h.state.text, 'Middle line')
  assert.equal(h.state.lines[1].dom_line.classList.contains('active'), true)
  h.assertIdle()
  h.api.setLyric(lineLyric, ['[00:40.000]Translation'])
  h.api.syncPausedTime(45000)
  assert.equal(h.state.line, 1)
  assert.equal(h.state.lines[1].extendedLyrics[0], 'Translation')
  h.assertIdle()
  const eventsBefore = h.events.length
  h.advance(10000)
  assert.equal(h.events.length, eventsBefore)
  h.release()
})

test('before-first and past-last paused positions remain safe and stop all scheduling', () => {
  for (const [time, expectedLine] of [[0, -1], [80000, 2]]) {
    const h = createHarness()
    h.api.setLyric(lineLyric, [])
    h.api.syncPausedTime(time)
    assert.equal(h.state.line, expectedLine)
    h.assertIdle()
    h.release()
  }
})

test('paused offset and playback-rate changes restore the correct adjusted line', () => {
  const h = createHarness()
  h.api.setLyric(lineLyric, [])
  h.api.syncPausedTime(45000)
  h.api.setOffset(17000)
  h.api.syncPausedTime(45000)
  assert.equal(h.state.line, 2)
  h.assertIdle()
  h.api.setPlaybackRate(2)
  h.api.syncPausedTime(45000)
  assert.equal(h.state.line, 2)
  assert.equal(h.api.getEngine().linePlayer._rate, 2)
  h.assertIdle()
  h.api.setOffset(-40000)
  h.api.syncPausedTime(45000)
  assert.equal(h.state.line, -1)
  h.assertIdle()
  h.release()
})

test('word lyrics restore current line/word and pause their animation immediately', () => {
  const h = createHarness()
  h.api.setLyric(wordLyric, [])
  h.api.syncPausedTime(45000)
  assert.equal(h.state.line, 1)
  const font = h.api.getEngine()._lineFonts[1]
  assert.equal(font.curFontNum, 1)
  assert.equal(font.fonts[0].dom.style.backgroundSize, '100% 100%')
  assert.equal(font.fonts[1].animation.playState, 'paused')
  h.assertIdle()
  h.release()
})

test('word lyrics before-first, final-line midword and after-end leave no timers or running animation', () => {
  for (const [time, expectedLine] of [[0, -1], [60500, 2], [80000, 2]]) {
    const h = createHarness()
    h.api.setLyric(wordLyric, [])
    h.api.syncPausedTime(time)
    assert.equal(h.state.line, expectedLine)
    h.assertIdle()
    h.release()
  }
})

test('a paused word-lyric rate rebuild uses new animation durations and still cleans up', () => {
  const h = createHarness()
  h.api.setLyric(wordLyric, [])
  h.api.syncPausedTime(45000)
  h.api.setPlaybackRate(2)
  h.api.syncPausedTime(45000)
  const font = h.api.getEngine()._lineFonts[1]
  assert.equal(font.fonts[1].animation.effect.options.duration, 2000)
  assert.equal(font.fonts[1].animation.playState, 'paused')
  h.assertIdle()
  h.release()
})

test('empty lyrics accept paused synchronization without callbacks or pending work', () => {
  const h = createHarness()
  h.api.setLyric('', [])
  const count = h.events.length
  h.api.syncPausedTime(45000)
  assert.equal(h.events.length, count)
  h.assertIdle()
  h.release()
})
