import { writable } from 'svelte/store'

export const lyricLoadState = writable<{
  trackId: string | null
  status: 'idle' | 'loading' | 'ready' | 'error'
}>({ trackId: null, status: 'idle' })
