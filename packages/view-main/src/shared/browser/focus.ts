// Programmatic focus after clicking a menu can inherit Chromium's keyboard ring.
// Track the input method without moving focus or changing keyboard navigation.
export const initFocusIndicator = () => {
  const root = document.documentElement
  const controller = new AbortController()
  const options = { capture: true, signal: controller.signal }

  root.dataset.inputMethod ??= 'keyboard'
  document.addEventListener('pointerdown', () => { root.dataset.inputMethod = 'pointer' }, options)
  document.addEventListener('keydown', (event) => {
    if (event.ctrlKey || event.altKey || event.metaKey || ['Shift', 'Control', 'Alt', 'Meta'].includes(event.key)) return
    root.dataset.inputMethod = 'keyboard'
  }, options)

  return () => { controller.abort() }
}
