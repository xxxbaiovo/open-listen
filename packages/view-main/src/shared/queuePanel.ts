import { writable } from 'svelte/store'

export const queuePanelOpen = writable(false)
let trigger: HTMLButtonElement | null = null

export const toggleQueuePanel = (button: HTMLButtonElement) => {
  trigger = button
  queuePanelOpen.update((open) => !open)
}

export const closeQueuePanel = () => {
  queuePanelOpen.set(false)
  if (trigger?.isConnected) trigger.focus()
}
