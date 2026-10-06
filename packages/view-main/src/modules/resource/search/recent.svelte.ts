import { readonly, writable } from 'svelte/store'

import { getItem, LOCAL_STORE_KEYS, setItem } from '@/shared/localStore'

export interface RecentSearch {
  kind: 'query' | 'music'
  id: string
  title: string
  keyword: string
  sourceId: string
  singer?: string
  picUrl?: string
  musicId?: string
  page?: number
}

type RecentSearchTrack = Pick<RecentSearch, 'keyword' | 'sourceId' | 'title' | 'singer' | 'picUrl' | 'page'> & {
  musicId: string
}

const MAX_RECENT_SEARCHES = 20
const cleanText = (value: unknown, limit = 500): string =>
  typeof value === 'string' ? value.trim().slice(0, limit) : ''

const normalizeEntry = (value: unknown): RecentSearch | null => {
  if (!value || typeof value !== 'object') return null
  const item = value as Record<string, unknown>
  if (item.kind !== 'query' && item.kind !== 'music') return null
  const keyword = cleanText(item.keyword)
  const sourceId = cleanText(item.sourceId)
  if (!keyword || !sourceId) return null
  if (item.kind === 'query') {
    return {
      kind: 'query',
      id: JSON.stringify(['query', sourceId, keyword.toLocaleLowerCase()]),
      title: keyword,
      keyword,
      sourceId,
    }
  }
  const musicId = cleanText(item.musicId, 1000)
  const title = cleanText(item.title)
  if (!musicId || !title) return null
  const picUrl = cleanText(item.picUrl, 4000)
  return {
    kind: 'music',
    id: JSON.stringify(['music', sourceId, musicId]),
    title,
    keyword,
    sourceId,
    musicId,
    singer: cleanText(item.singer) || undefined,
    picUrl: /^https?:\/\//i.test(picUrl) ? picUrl : undefined,
    page: typeof item.page === 'number' && Number.isSafeInteger(item.page) && item.page > 0 ? item.page : 1,
  }
}

const loadEntries = (): RecentSearch[] => {
  try {
    const value: unknown = JSON.parse(getItem(LOCAL_STORE_KEYS.recentSearches) ?? '[]')
    if (!Array.isArray(value)) return []
    const entries: RecentSearch[] = []
    for (const rawEntry of value) {
      const entry = normalizeEntry(rawEntry)
      if (!entry || entries.some((existing) => existing.id === entry.id)) continue
      entries.push(entry)
      if (entries.length === MAX_RECENT_SEARCHES) break
    }
    return entries
  } catch {
    return []
  }
}

const entries = writable<RecentSearch[]>(loadEntries())
export const recentSearches = readonly(entries)

const updateEntries = (update: (current: RecentSearch[]) => RecentSearch[]) => {
  entries.update((current) => {
    const next = update(current).slice(0, MAX_RECENT_SEARCHES)
    try {
      setItem(LOCAL_STORE_KEYS.recentSearches, JSON.stringify(next))
    } catch {
      // Browsing and playback still work when local storage is unavailable or full.
    }
    return next
  })
}

const rememberEntry = (value: unknown) => {
  const entry = normalizeEntry(value)
  if (!entry) return
  updateEntries((current) => [entry, ...current.filter((item) => item.id !== entry.id)])
}

export const rememberSearch = (keyword: string, sourceId: string) => {
  rememberEntry({ kind: 'query', keyword, sourceId })
}

export const rememberSearchTrack = (track: RecentSearchTrack) => {
  rememberEntry({ ...track, kind: 'music' })
}

export const removeRecentSearch = (id: string) => {
  updateEntries((current) => current.filter((entry) => entry.id !== id))
}

export const clearRecentSearches = () => {
  updateEntries(() => [])
}
