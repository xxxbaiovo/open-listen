type ScrollViewport = Pick<HTMLElement, 'scrollTop' | 'scrollHeight' | 'clientHeight'>
interface FrameClock {
  request: (callback: FrameRequestCallback) => number
  cancel: (id: number) => void
  now: () => number
}

/** One owner for animated following and frame-batched mouse dragging. */
export const createLyricScroller = (
  viewport: ScrollViewport,
  clock: FrameClock = {
    request: (callback) => window.requestAnimationFrame(callback),
    cancel: (id) => window.cancelAnimationFrame(id),
    now: () => performance.now(),
  }
) => {
  let frame: number | null = null
  let disposed = false
  let pendingTop = 0
  let dragging = false

  const cancel = () => {
    if (frame !== null) clock.cancel(frame)
    frame = null
    dragging = false
  }
  const clamp = (top: number) => Math.max(0, Math.min(top, Math.max(0, viewport.scrollHeight - viewport.clientHeight)))

  return {
    cancel,
    scrollTo(top: number, duration: number) {
      cancel()
      if (disposed) return
      const start = viewport.scrollTop
      const target = clamp(top)
      const distance = target - start
      if (duration <= 0 || Math.abs(distance) < 0.5) {
        viewport.scrollTop = target
        return
      }
      const startedAt = clock.now()
      const step = (timestamp: number) => {
        frame = null
        if (disposed) return
        const progress = Math.min(1, Math.max(0, (timestamp - startedAt) / duration))
        // Elapsed time, rather than timer ticks, keeps 60/120 Hz and dropped frames in sync.
        const eased = 1 - (1 - progress) ** 3
        viewport.scrollTop = start + distance * eased
        if (progress < 1) frame = clock.request(step)
      }
      frame = clock.request(step)
    },
    dragTo(top: number) {
      if (disposed) return
      pendingTop = top
      if (dragging) return
      cancel()
      dragging = true
      frame = clock.request(() => {
        frame = null
        dragging = false
        if (!disposed) viewport.scrollTop = clamp(pendingTop)
      })
    },
    dispose() {
      disposed = true
      cancel()
    },
  }
}

/** Geometry is measured on content/viewport changes, never for each wheel event. */
export const nearestLyricLine = (centers: readonly number[], target: number): number => {
  if (!centers.length) return -1
  let low = 0
  let high = centers.length - 1
  while (low < high) {
    const middle = (low + high) >> 1
    if (centers[middle] < target) low = middle + 1
    else high = middle
  }
  if (low > 0 && target - centers[low - 1] < centers[low] - target) return low - 1
  return low
}
