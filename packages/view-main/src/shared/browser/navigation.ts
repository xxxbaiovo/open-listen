import { readable } from 'svelte/store'

// Mark entries in the existing router history, including query-only search changes.
// Keep the cursor across reloads without letting Back leave this app session.
const key = '__anyListenHistoryIndex'
const endKey = 'any-listen-history-end'
const getIndex = () => (window.history.state as Record<string, unknown> | null)?.[key]

export const historyNavigation = readable({ canBack: false, canForward: false }, (set) => {
  let index = getIndex()
  let current = typeof index === 'number' ? index : 0
  let end = typeof index === 'number' ? Math.max(current, Number(sessionStorage.getItem(endKey)) || 0) : 0
  const publish = () => {
    set({ canBack: current > 0, canForward: current < end })
  }
  const mark = () => {
    window.history.replaceState({ ...window.history.state, [key]: current }, '')
    sessionStorage.setItem(endKey, String(end))
  }
  mark()
  publish()
  const update = () => {
    index = getIndex()
    if (typeof index === 'number') current = index
    else {
      current += 1
      end = current
      mark()
    }
    publish()
  }
  window.addEventListener('hashchange', update)
  return () => window.removeEventListener('hashchange', update)
})
