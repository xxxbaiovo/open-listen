import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
import { stripTypeScriptTypes } from 'node:module'
import vm from 'node:vm'

import { createLyricScroller, nearestLyricLine } from '../src/shared/lyricScroll.ts'

const makeClock = () => {
  let now = 0
  let nextId = 1
  const frames = new Map()
  const timers = new Map()
  return {
    request(callback) { const id = nextId++; frames.set(id, callback); return id },
    cancel(id) { frames.delete(id) },
    now: () => now,
    setTimeout(callback, delay) { const id = nextId++; timers.set(id, { at: now + delay, callback }); return id },
    clearTimeout(id) { timers.delete(id) },
    advance(milliseconds) {
      now += milliseconds
      for (const [id, timer] of [...timers]) {
        if (timer.at <= now) { timers.delete(id); timer.callback() }
      }
    },
    frame(milliseconds = 16) {
      now += milliseconds
      const callbacks = [...frames.values()]
      frames.clear()
      for (const callback of callbacks) callback(now)
    },
    get frames() { return frames.size },
    get timers() { return timers.size },
  }
}
const makeViewport = () => {
  let top = 0
  let writes = 0
  let geometryReads = 0
  const listeners = new Map()
  return {
    listeners,
    addEventListener(name, callback, options) { listeners.set(name, { callback, options }) },
    removeEventListener(name, callback) {
      if (listeners.get(name)?.callback === callback) listeners.delete(name)
    },
    get scrollTop() { return top },
    set scrollTop(value) { top = value; writes++ },
    get scrollHeight() { geometryReads++; return 2000 },
    get clientHeight() { geometryReads++; return 400 },
    get writes() { return writes },
    get geometryReads() { return geometryReads },
    getBoundingClientRect: () => ({ top: 0 }),
  }
}

test('a burst of mouse moves produces one scroll write and one geometry read batch per frame', () => {
  const clock = makeClock()
  const viewport = makeViewport()
  const scroller = createLyricScroller(viewport, clock)
  for (let top = 1; top <= 200; top++) scroller.dragTo(top)
  assert.equal(clock.frames, 1)
  assert.equal(viewport.writes, 0)
  assert.equal(viewport.geometryReads, 0)
  clock.frame()
  assert.equal(viewport.scrollTop, 200)
  assert.equal(viewport.writes, 1)
  assert.equal(viewport.geometryReads, 2)
})

test('following uses real elapsed time and retargets without queued obsolete animations', () => {
  const clock = makeClock()
  const viewport = makeViewport()
  const scroller = createLyricScroller(viewport, clock)
  scroller.scrollTo(1000, 1000)
  clock.frame(500)
  assert.equal(viewport.scrollTop, 875)
  scroller.scrollTo(200, 100)
  assert.equal(clock.frames, 1)
  clock.frame(100)
  assert.equal(viewport.scrollTop, 200)
  assert.equal(clock.frames, 0)
})

test('manual dragging cancels following, clamps to the scroll range, and disposal cancels pending work', () => {
  const clock = makeClock()
  const viewport = makeViewport()
  const scroller = createLyricScroller(viewport, clock)
  scroller.scrollTo(900, 500)
  scroller.dragTo(4000)
  clock.frame()
  assert.equal(viewport.scrollTop, 1600)
  assert.equal(clock.frames, 0)
  scroller.dragTo(-50)
  scroller.dispose()
  clock.frame()
  assert.equal(viewport.scrollTop, 1600)
  scroller.scrollTo(0, 0)
  assert.equal(viewport.scrollTop, 1600)
})

test('reduced-motion/immediate following is clamped and schedules no animation', () => {
  const clock = makeClock()
  const viewport = makeViewport()
  const scroller = createLyricScroller(viewport, clock)
  scroller.scrollTo(3000, 0)
  assert.equal(viewport.scrollTop, 1600)
  assert.equal(clock.frames, 0)
})

test('cached line centers select the nearest line at gaps and both boundaries', () => {
  assert.equal(nearestLyricLine([], 100), -1)
  assert.equal(nearestLyricLine([50, 170, 350], -20), 0)
  assert.equal(nearestLyricLine([50, 170, 350], 149), 1)
  assert.equal(nearestLyricLine([50, 170, 350], 300), 2)
  assert.equal(nearestLyricLine([50, 170, 350], 3000), 2)
})

const hookSource = stripTypeScriptTypes(await readFile(
  new URL('../src/components/layout/PlayDetail/RightLyric/useLyric.svelte.ts', import.meta.url), 'utf8'
)).replace(/^import .*$/gm, '').replace('export const useLyric', 'const useLyric') + '\nuseLyric'

const makeHook = async () => {
  const clock = makeClock()
  const viewport = makeViewport()
  const listeners = new Map()
  const events = new Map()
  let mount
  let disposed = false
  let stopped = false
  let sought = null
  let plays = 0
  class Element {
    constructor(top, text) { this.offsetTop = top; this.clientHeight = 80; this.text = text; this.attributes = new Map() }
    closest(selector) { return selector === '.line-content' ? this : null }
    setAttribute(key, value) { this.attributes.set(key, value) }
    removeAttribute(key) { this.attributes.delete(key) }
  }
  const lines = [
    {time: 1000, text: 'First line', dom_line: new Element(250, 'First line')},
    {time: 5000, text: 'Second line', dom_line: new Element(650, 'Second line')},
  ]
  const lyricState = { lines, line: 0, offset: 0 }
  const document = {
    createDocumentFragment: () => ({ appendChild() {} }),
    addEventListener: (name, callback) => listeners.set(name, callback),
    removeEventListener: (name) => listeners.delete(name),
  }
  const useLyric = vm.runInNewContext(hookSource, {
    onMount: (callback) => { mount = callback },
    tick: () => Promise.resolve(),
    lyricEvent: { on(name, callback) { events.set(name, callback); return () => events.delete(name) } },
    lyricState,
    seekTo: (time) => { sought = time },
    play: () => { plays++ },
    playerState: { playing: false, progress: { maxPlayTime: 100 } },
    settingState: { setting: { 'playDetail.isDelayScroll': true } },
    formatPlayTime2: (seconds) => String(seconds),
    createLyricScroller: (element) => createLyricScroller(element, clock),
    nearestLyricLine,
    requestAnimationFrame: clock.request,
    cancelAnimationFrame: clock.cancel,
    setTimeout: clock.setTimeout,
    clearTimeout: clock.clearTimeout,
    performance: {now: clock.now},
    ResizeObserver: class { observe() {} disconnect() { disposed = true } },
    Element, document,
    window: {
      matchMedia: () => ({ matches: false }),
      addEventListener: (name, callback) => listeners.set(name, callback),
      removeEventListener: (name) => listeners.delete(name),
    },
  })
  const api = useLyric({
    domLyric: viewport,
    domLyricText: {replaceChildren() {}, contains: (line) => lines.some((item) => item.dom_line === line)},
    domSkipLine: {getBoundingClientRect: () => ({top: 184})},
    onSetMsDown() {},
    onSetStopScroll: (value) => { stopped = value },
    onSetTimeStr() {},
  })
  const cleanup = mount()
  await Promise.resolve()
  clock.frame()
  return {clock, viewport, api, cleanup, listeners, events, lines, lyricState,
    get stopped() { return stopped }, get disposed() { return disposed },
    get sought() { return sought }, get plays() { return plays }}
}

test('wheel bursts preserve native scrolling: no synchronous layout reads or scroll writes', async () => {
  const hook = await makeHook()
  const reads = hook.viewport.geometryReads
  const writes = hook.viewport.writes
  for (let index = 0; index < 100; index++) hook.api.handleWheel({deltaY: 3, ctrlKey: false})
  assert.equal(hook.viewport.geometryReads, reads)
  assert.equal(hook.viewport.writes, writes)
  assert.equal(hook.stopped, true)
  assert.equal(hook.clock.timers, 1)
  await Promise.resolve()
  assert.equal(hook.clock.frames, 1)
  hook.cleanup()
})

test('following stays suspended throughout a held drag and a drag cannot accidentally seek', async () => {
  const hook = await makeHook()
  hook.api.handleLyricMouseDown({button: 0, target: hook.lines[0].dom_line, clientY: 100})
  hook.listeners.get('mousemove')({clientY: 60, preventDefault() {}})
  hook.clock.advance(5000)
  assert.equal(hook.stopped, true)
  assert.equal(hook.clock.timers, 0)
  hook.listeners.get('mouseup')()
  hook.api.handleLyricClick({button: 0, target: hook.lines[1].dom_line})
  assert.equal(hook.sought, null)
  assert.equal(hook.clock.timers, 1)
  hook.cleanup()
})

test('line keyboard activation seeks/plays while native navigation only pauses following', async () => {
  const hook = await makeHook()
  let prevented = false
  hook.api.handleLyricKeyDown({key: 'Enter', target: hook.lines[1].dom_line, repeat: false,
    preventDefault() { prevented = true }, stopPropagation() {}})
  assert.equal(hook.sought, 5)
  assert.equal(hook.plays, 1)
  assert.equal(prevented, true)
  prevented = false
  hook.api.handleLyricKeyDown({key: 'PageDown', target: hook.lines[1].dom_line,
    preventDefault() { prevented = true }, stopPropagation() {}})
  assert.equal(prevented, false)
  assert.equal(hook.stopped, true)
  hook.cleanup()
})

test('unmount clears every listener/timer/frame and late tick callbacks cannot restart work', async () => {
  const hook = await makeHook()
  hook.api.handleWheel({deltaY: 10, ctrlKey: false})
  hook.api.handleResumeScroll()
  hook.cleanup()
  await Promise.resolve()
  assert.equal(hook.listeners.size, 0)
  assert.equal(hook.events.size, 0)
  assert.equal(hook.clock.frames, 0)
  assert.equal(hook.clock.timers, 0)
  assert.equal(hook.disposed, true)
  for (const {dom_line} of hook.lines) assert.equal(dom_line.attributes.size, 0)
})

test('rapid sequential lyrics do not postpone delayed following indefinitely', async () => {
  const hook = await makeHook()
  hook.lyricState.line = 1
  hook.events.get('lineChanged')('Second line', 1)
  hook.clock.advance(200)
  hook.lyricState.line = 2
  hook.events.get('lineChanged')('Third line', 2)
  hook.clock.advance(450)
  assert.equal(hook.clock.timers, 0)
  assert.equal(hook.clock.frames, 1)
  hook.cleanup()
})

test('Space on the scroll container pauses following without preventing native page scrolling', async () => {
  const hook = await makeHook()
  let prevented = false
  hook.api.handleLyricKeyDown({key: ' ', target: hook.viewport, repeat: false,
    preventDefault() { prevented = true }, stopPropagation() {}})
  assert.equal(prevented, false)
  assert.equal(hook.stopped, true)
  assert.equal(hook.sought, null)
  hook.cleanup()
})

test('touch scrolling suppresses a synthesized click while a stationary tap still seeks', async () => {
  const hook = await makeHook()
  hook.api.handleLyricTouchStart({changedTouches: [{clientY: 100}]})
  hook.listeners.get('touchmove')({changedTouches: [{clientY: 60}]})
  hook.listeners.get('touchend')({touches: []})
  hook.api.handleLyricClick({button: 0, target: hook.lines[1].dom_line})
  assert.equal(hook.sought, null)
  hook.clock.advance(500)
  hook.api.handleLyricTouchStart({changedTouches: [{clientY: 100}]})
  hook.listeners.get('touchend')({touches: []})
  hook.api.handleLyricClick({button: 0, target: hook.lines[1].dom_line})
  assert.equal(hook.sought, 5)
  hook.cleanup()
})

test('wheel listening is explicitly passive and is removed on unmount', async () => {
  const hook = await makeHook()
  const listener = hook.viewport.listeners.get('wheel')
  assert.equal(listener.options.passive, true)
  assert.equal(typeof listener.callback, 'function')
  const reads = hook.viewport.geometryReads
  const writes = hook.viewport.writes
  listener.callback({deltaY: 8, ctrlKey: false})
  assert.equal(hook.stopped, true)
  assert.equal(hook.viewport.geometryReads, reads)
  assert.equal(hook.viewport.writes, writes)
  hook.cleanup()
  assert.equal(hook.viewport.listeners.size, 0)
})
test('paused manual browsing retains the return control until explicitly resumed', async () => {
  const hook = await makeHook()
  hook.api.handleWheel({ deltaY: 20, ctrlKey: false })
  hook.clock.advance(4000)
  assert.equal(hook.stopped, true)
  hook.api.handleResumeScroll()
  assert.equal(hook.stopped, false)
  hook.cleanup()
})

test('the default clock invokes browser frame methods with their Window receiver', async () => {
  const source = stripTypeScriptTypes(await readFile(new URL('../src/shared/lyricScroll.ts', import.meta.url), 'utf8'))
    .replaceAll('export const', 'const') + '\ncreateLyricScroller'
  let requested = 0
  let cancelled = 0
  const owner = {
    requestAnimationFrame() { assert.equal(this, owner); requested++; return 7 },
    cancelAnimationFrame(id) { assert.equal(this, owner); assert.equal(id, 7); cancelled++ },
  }
  const factory = vm.runInNewContext(source, { window: owner, performance: { now: () => 0 } })
  const scroller = factory(makeViewport())
  scroller.scrollTo(300, 500)
  assert.equal(requested, 1)
  scroller.dispose()
  assert.equal(cancelled, 1)
})
