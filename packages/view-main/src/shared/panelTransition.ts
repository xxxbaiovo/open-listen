import { cubicOut } from 'svelte/easing'
import type { TransitionConfig } from 'svelte/transition'

// Translate the panel as one composited surface, without animating layout width.
export const panelTransition = (node: HTMLElement, { enabled = true, duration = 280 } = {}): TransitionConfig => {
  const distance = node.offsetWidth + 12
  return {
    duration: enabled ? duration : 0,
    easing: cubicOut,
    css: (t) => `transform: translate3d(${(1 - t) * distance}px, 0, 0);`,
  }
}
