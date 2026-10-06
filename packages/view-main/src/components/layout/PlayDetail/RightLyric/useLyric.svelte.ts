import { onMount, tick } from 'svelte'

import { lyricEvent } from '@/modules/lyric/store/event'
import { lyricState, type Line } from '@/modules/lyric/store/state'
import { play, seekTo } from '@/modules/player/actions'
import { playerState } from '@/modules/player/store/state'
import { settingState } from '@/modules/setting/store/state'
import { formatPlayTime2 } from '@/shared'
import { createLyricScroller, nearestLyricLine } from '@/shared/lyricScroll'

export const useLyric = (options: {
  domLyric: HTMLElement | undefined
  domLyricText: HTMLElement | undefined
  domSkipLine: HTMLElement | undefined
  onSetMsDown: (isMsDown: boolean) => void
  onSetStopScroll: (isStop: boolean) => void
  onSetTimeStr: (timeStr: string) => void
}) => {
  let isMsDown = false
  let isStopScroll = false
  let isTouching = false
  let touchStartY = 0
  let touchMoved = false
  let isSkipMouseEnter = false
  let destroyed = false
  let dragged = false
  let suppressClickUntil = 0
  let downY = 0
  let downScrollTop = 0
  let timeout: number | null = null
  let delayScrollTimeout: number | null = null
  let readFrame: number | null = null
  let geometryDirty = true
  let followDuration: number | null = null
  let generation = 0
  let oldLine = -1
  let time = -1
  let domLines: HTMLElement[] = []
  let currentLines: Line[] = []
  let centers: number[] = []
  let firstLineTop = 0
  let anchorOffset = 0
  let viewportHeight = 0
  let scroller: ReturnType<typeof createLyricScroller> | undefined

  const clearLyricScrollTimeout = () => {
    if (timeout !== null) clearTimeout(timeout)
    timeout = null
  }
  const clearDelayScrollTimeout = () => {
    if (delayScrollTimeout !== null) clearTimeout(delayScrollTimeout)
    delayScrollTimeout = null
  }
  const setStopped = (stopped: boolean) => {
    if (isStopScroll === stopped) return
    isStopScroll = stopped
    options.onSetStopScroll(stopped)
  }
  const getLineTime = (milliseconds: number) =>
    Math.min(Math.max((milliseconds - lyricState.offset) / 1000, 0), playerState.progress.maxPlayTime)

  const updateTime = () => {
    if (!isStopScroll || !options.domLyric) return
    const position = options.domLyric.scrollTop + anchorOffset
    const index = nearestLyricLine(centers, position)
    const nextTime = index < 0 ? -1 : getLineTime(position < firstLineTop ? 0 : currentLines[index].time)
    if (nextTime === time) return
    time = nextTime
    options.onSetTimeStr(time < 0 ? '--:--' : formatPlayTime2(time))
  }
  const measureLines = () => {
    const viewport = options.domLyric
    if (!viewport) return
    viewportHeight = viewport.clientHeight
    centers = domLines.map((line) => line.offsetTop + line.clientHeight / 2)
    firstLineTop = domLines[0]?.offsetTop ?? 0
    anchorOffset = viewportHeight * 0.46
    if (options.domSkipLine) {
      anchorOffset = options.domSkipLine.getBoundingClientRect().top - viewport.getBoundingClientRect().top
    }
    geometryDirty = false
  }
  const scheduleRead = () => {
    if (destroyed || readFrame !== null) return
    readFrame = requestAnimationFrame(() => {
      readFrame = null
      if (destroyed) return
      if (geometryDirty) measureLines()
      updateTime()
      const duration = followDuration
      followDuration = null
      if (duration === null || isStopScroll || isMsDown || isTouching || isSkipMouseEnter) return
      const center = centers[Math.max(lyricState.line, 0)]
      const top = center === undefined ? 0 : center - viewportHeight * 0.46
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      scroller?.scrollTo(top, reducedMotion ? 0 : duration)
    })
  }
  const handleScrollLrc = (duration = 360) => {
    oldLine = lyricState.line
    if (destroyed || isStopScroll || isMsDown || isTouching || isSkipMouseEnter) return
    followDuration = duration
    scheduleRead()
  }
  const startLyricScrollTimeout = () => {
    clearLyricScrollTimeout()
    if (destroyed || isMsDown || isTouching || isSkipMouseEnter) return
    timeout = setTimeout(() => {
      timeout = null
      if (!playerState.playing) return
      setStopped(false)
      handleScrollLrc()
    }, 3000)
  }
  const stopFollowing = () => {
    clearDelayScrollTimeout()
    clearLyricScrollTimeout()
    followDuration = null
    scroller?.cancel()
    const enteringManual = !isStopScroll
    setStopped(true)
    // Measure the conditionally mounted marker once, not once per wheel event.
    if (enteringManual) {
      void tick().then(() => {
        if (destroyed || !isStopScroll) return
        geometryDirty = true
        scheduleRead()
      })
    }
  }
  const handleResumeScroll = () => {
    clearLyricScrollTimeout()
    clearDelayScrollTimeout()
    isSkipMouseEnter = false
    setStopped(false)
    handleScrollLrc()
  }
  const seekLine = (milliseconds: number) => {
    seekTo(getLineTime(milliseconds))
    if (!playerState.playing) play()
    handleResumeScroll()
  }
  const handleSkipPlay = () => {
    if (time < 0) return
    seekTo(time)
    if (!playerState.playing) play()
    handleResumeScroll()
  }
  const handleSkipMouseEnter = () => {
    isSkipMouseEnter = true
    clearLyricScrollTimeout()
  }
  const handleSkipMouseLeave = () => {
    isSkipMouseEnter = false
    if (isStopScroll) startLyricScrollTimeout()
  }

  const handleLyricMouseDown = (event: MouseEvent) => {
    if (event.button !== 0 || !options.domLyric) return
    if ((event.target as HTMLElement).closest('button, a, input, textarea, select')) return
    clearLyricScrollTimeout()
    clearDelayScrollTimeout()
    followDuration = null
    scroller?.cancel()
    isMsDown = true
    dragged = false
    options.onSetMsDown(true)
    downY = event.clientY
    downScrollTop = options.domLyric.scrollTop
  }
  const handleMouseMove = (event: MouseEvent) => {
    if (!isMsDown || !options.domLyric) return
    if (!dragged && Math.abs(event.clientY - downY) < 4) return
    if (!dragged) {
      dragged = true
      stopFollowing()
    }
    event.preventDefault()
    scroller?.dragTo(downScrollTop + downY - event.clientY)
  }
  const handleMouseUp = () => {
    if (!isMsDown) return
    isMsDown = false
    options.onSetMsDown(false)
    if (dragged) suppressClickUntil = performance.now() + 200
    if (isStopScroll) startLyricScrollTimeout()
    else handleScrollLrc(180)
  }
  const handleLyricTouchStart = (event: TouchEvent) => {
    isTouching = true
    touchStartY = event.changedTouches[0]?.clientY ?? 0
    touchMoved = false
    stopFollowing()
  }
  const handleTouchMove = (event: TouchEvent) => {
    if (!isTouching || !event.changedTouches.length) return
    touchMoved ||= Math.abs(event.changedTouches[0].clientY - touchStartY) >= 6
  }
  const handleTouchEnd = (event: TouchEvent) => {
    if (event.touches.length) return
    isTouching = false
    if (touchMoved) suppressClickUntil = performance.now() + 400
    if (isStopScroll) startLyricScrollTimeout()
  }
  const handleWindowBlur = () => {
    handleMouseUp()
    isTouching = false
    if (isStopScroll) startLyricScrollTimeout()
  }
  const handleWheel = (event: WheelEvent) => {
    if (event.ctrlKey || !event.deltaY) return
    // Native scrolling preserves trackpad momentum and deltaMode; do not write scrollTop here.
    stopFollowing()
    startLyricScrollTimeout()
  }
  const handleScroll = () => {
    if (!isStopScroll) return
    scheduleRead()
    // Momentum keeps manual browsing active after the finger/wheel gesture ends.
    startLyricScrollTimeout()
  }
  const findLine = (target: EventTarget | null) => {
    if (!(target instanceof Element)) return -1
    const line = target.closest<HTMLElement>('.line-content')
    return line && options.domLyricText?.contains(line) ? domLines.indexOf(line) : -1
  }
  const handleLyricClick = (event: MouseEvent) => {
    if (event.button !== 0 || performance.now() < suppressClickUntil) return
    const index = findLine(event.target)
    if (index >= 0) seekLine(currentLines[index].time)
  }
  const handleLyricKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      const index = findLine(event.target)
      if (index < 0) {
        if (event.key === ' ' && event.target === options.domLyric) {
          event.stopPropagation()
          stopFollowing()
          startLyricScrollTimeout()
        }
        return
      }
      if (event.repeat) return
      event.preventDefault()
      event.stopPropagation()
      seekLine(currentLines[index].time)
    } else if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End'].includes(event.key)) {
      event.stopPropagation()
      stopFollowing()
      startLyricScrollTimeout()
    }
  }

  const initLrc = (lines: Line[]) => {
    generation++
    const nextGeneration = generation
    clearLyricScrollTimeout()
    clearDelayScrollTimeout()
    followDuration = null
    scroller?.cancel()
    setStopped(false)
    isSkipMouseEnter = false
    time = -1
    options.onSetTimeStr('--:--')
    oldLine = -1
    currentLines = lines
    const fragment = document.createDocumentFragment()
    for (const line of lines) {
      line.dom_line.tabIndex = 0
      line.dom_line.setAttribute('role', 'button')
      line.dom_line.setAttribute('aria-label', `${formatPlayTime2(getLineTime(line.time))} ${line.text}`)
      fragment.appendChild(line.dom_line)
    }
    options.domLyricText?.replaceChildren(fragment)
    domLines = lines.map((line) => line.dom_line)
    geometryDirty = true
    void tick().then(() => {
      if (destroyed || nextGeneration !== generation) return
      handleScrollLrc(0)
    })
  }
  const scrollLine = (line: number) => {
    if (line === oldLine) return
    const sequential = line >= 0 && line - oldLine === 1
    oldLine = line
    if (isStopScroll || isMsDown || isTouching) {
      clearDelayScrollTimeout()
      return
    }
    if (sequential && settingState.setting['playDetail.isDelayScroll']) {
      delayScrollTimeout ??= setTimeout(() => {
        delayScrollTimeout = null
        handleScrollLrc(500)
      }, 650)
    } else {
      clearDelayScrollTimeout()
      handleScrollLrc(sequential ? 500 : 300)
    }
  }

  onMount(() => {
    if (options.domLyric) scroller = createLyricScroller(options.domLyric)
    const viewport = options.domLyric
    viewport?.addEventListener('wheel', handleWheel, { passive: true })
    const unsub = lyricEvent.on('linesChanged', initLrc)
    const unsub2 = lyricEvent.on('lineChanged', (_text, line) => scrollLine(line))
    const observer = new ResizeObserver(() => {
      geometryDirty = true
      if (isStopScroll) scheduleRead()
      else handleScrollLrc(0)
    })
    if (options.domLyric) observer.observe(options.domLyric)
    if (options.domLyricText) observer.observe(options.domLyricText)
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    document.addEventListener('touchmove', handleTouchMove, { passive: true })
    document.addEventListener('touchend', handleTouchEnd, { passive: true })
    document.addEventListener('touchcancel', handleTouchEnd, { passive: true })
    window.addEventListener('blur', handleWindowBlur)
    initLrc(lyricState.lines)
    return () => {
      destroyed = true
      generation++
      unsub()
      unsub2()
      observer.disconnect()
      viewport?.removeEventListener('wheel', handleWheel)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
      document.removeEventListener('touchcancel', handleTouchEnd)
      window.removeEventListener('blur', handleWindowBlur)
      clearLyricScrollTimeout()
      clearDelayScrollTimeout()
      if (readFrame !== null) cancelAnimationFrame(readFrame)
      scroller?.dispose()
      // These elements also belong to the shared lyric player; keep view-only semantics local.
      for (const line of domLines) {
        line.removeAttribute('tabindex')
        line.removeAttribute('role')
        line.removeAttribute('aria-label')
      }
    }
  })

  return {
    isStopScroll,
    isMsDown,
    handleLyricMouseDown,
    handleLyricTouchStart,
    handleWheel,
    handleScroll,
    handleSkipPlay,
    handleSkipMouseEnter,
    handleSkipMouseLeave,
    handleScrollLrc,
    handleResumeScroll,
    handleLyricClick,
    handleLyricKeyDown,
  }
}
