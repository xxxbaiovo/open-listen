type SearchParams = AnyListen.IPCExtension.MusicSearchParams
type SearchResult = AnyListen.IPCResource.MusicListResult
type MusicInfo = AnyListen.Music.MusicInfoOnline
type RawMusic = Record<string, unknown> & { id: string | number; name: string }

const MAIN_API_URL = 'https://music-api.gdstudio.xyz/api.php'
const MAIN_SOURCES = new Set(['gd-netease', 'gd-kuwo', 'gd-joox', 'gd-bilibili'])
const CACHE_TTL = 5 * 60_000
const MAX_QUERIES = 12
const MAX_ITEMS = 3_000
const MAX_BATCHES_PER_REQUEST = 8

export interface SearchRequestOptions {
  method: 'GET'
  timeout: number
  retryNum: number
  headers: Record<string, string>
}
type Request = (url: string, options: SearchRequestOptions) => Promise<{ statusCode?: number; body: unknown }>

export const supportsNativeGdSearch = (extension: AnyListen.Extension.Extension, source: string) => {
  return (
    extension.id === 'gdstudio' &&
    extension.version === '0.4.3' &&
    extension.enabled &&
    extension.loaded &&
    !extension.removed &&
    extension.grant.includes('internet') &&
    MAIN_SOURCES.has(source) &&
    extension.contributes.resource?.some((item) => item.id === source && item.resource.includes('musicSearch')) === true
  )
}

class UnsupportedSearchResponse extends Error {}

const parseBatch = (body: unknown): RawMusic[] => {
  let data: unknown = body
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data)
    } catch {
      throw new UnsupportedSearchResponse()
    }
  }
  if (data && typeof data === 'object' && 'error' in data && data.error) {
    throw new Error('GDStudio search API returned an error')
  }
  if (
    !Array.isArray(data) ||
    !data.every(
      (item: unknown) =>
        item !== null &&
        typeof item === 'object' &&
        'id' in item &&
        (typeof item.id === 'string' || (typeof item.id === 'number' && Number.isFinite(item.id))) &&
        String(item.id).trim().length > 0 &&
        'name' in item &&
        typeof item.name === 'string'
    )
  ) {
    throw new UnsupportedSearchResponse()
  }
  return data as RawMusic[]
}

const optionalResourceId = (value: unknown) => {
  return typeof value === 'string' || typeof value === 'number' ? String(value).trim() || null : null
}
const formatInterval = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds <= 0) return null
  const hours = Math.floor(seconds / 3_600)
  const parts = [Math.floor((seconds % 3_600) / 60), Math.floor(seconds % 60)]
  if (hours) parts.unshift(hours)
  return parts.map((part) => String(part).padStart(2, '0')).join(':')
}
const buildMusicInfo = (item: RawMusic, source: string, now: number): MusicInfo => ({
  id: `gd:v1:${source.slice(3)}:${String(item.id)}`,
  name: item.name,
  singer: Array.isArray(item.artist)
    ? item.artist.join('、')
    : (typeof item.artist === 'string' ? item.artist : '')
        .split(/[、&_;/,，|]/)
        .map((artist) => artist.trim())
        .filter(Boolean)
        .join('、'),
  interval: formatInterval(Number(item.duration || item.interval)),
  isLocal: false,
  meta: {
    musicId: String(item.id),
    albumName: typeof item.album === 'string' ? item.album : '',
    source,
    picUrl: null,
    // Playback resolves the actual quality; search must not advertise an unverified bitrate.
    qualitys: {},
    _picId: optionalResourceId(item.pic_id),
    _lyricId: optionalResourceId(item.lyric_id),
    _gdResourceVersion: 1,
    createTime: now,
    updateTime: now,
    posTime: now,
  },
})

interface SearchSession {
  items: MusicInfo[]
  ids: Set<string>
  nextApiPage: number
  exhausted: boolean
  updatedAt: number
  pending?: Promise<void>
}

// GDStudio 0.4.3 protocol compatibility: only search metadata is handled here.
// Covers and audio stay with the installed extension; other versions use its original search.
export const createNativeGdSearch = (request: Request, now = Date.now) => {
  const sessions = new Map<string, SearchSession>()
  return async (params: SearchParams): Promise<SearchResult | undefined> => {
    if (!MAIN_SOURCES.has(params.source)) return
    const page = params.page || 1
    const limit = Math.min(params.limit || 20, 50)
    if (!Number.isSafeInteger(page) || page < 1 || !Number.isSafeInteger(limit) || limit < 1) return
    const start = (page - 1) * limit
    const end = start + limit
    // Very deep searches retain the original provider behavior without unbounded native memory.
    if (end > MAX_ITEMS) return
    const key = JSON.stringify([params.source, params.name, params.artist || '', limit])
    for (const [cachedKey, session] of sessions) {
      if (!session.pending && now() - session.updatedAt >= CACHE_TTL) sessions.delete(cachedKey)
    }
    let session = sessions.get(key)
    if (!session) {
      if (sessions.size >= MAX_QUERIES) {
        const oldest = [...sessions].find(([, entry]) => !entry.pending)
        if (!oldest) throw new Error('Too many music searches in progress')
        sessions.delete(oldest[0])
      }
      session = { items: [], ids: new Set(), nextApiPage: 1, exhausted: false, updatedAt: now() }
    }
    // Refresh the LRU position, including cache hits.
    sessions.delete(key)
    sessions.set(key, session)
    const current = session
    const loadNextBatch = async () => {
      if (current.pending) return current.pending
      current.pending = (async () => {
        const query = new URLSearchParams({
          types: 'search',
          source: params.source.slice(3),
          name: params.artist ? `${params.name} ${params.artist}` : params.name,
          count: String(limit * 3),
          pages: String(current.nextApiPage),
        })
        const response = await request(`${MAIN_API_URL}?${query.toString()}`, {
          method: 'GET',
          timeout: 15_000,
          retryNum: 0,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'X-Requested-With': 'XMLHttpRequest',
            Referer: 'https://music.gdstudio.org/',
          },
        })
        if (response.statusCode !== 200) throw new Error(`GDStudio search API returned HTTP ${response.statusCode}`)
        const batch = parseBatch(response.body)
        const previousSize = current.items.length
        for (const item of batch) {
          const music = buildMusicInfo(item, params.source, now())
          if (current.ids.has(music.id)) continue
          if (current.items.length >= MAX_ITEMS) break
          current.ids.add(music.id)
          current.items.push(music)
        }
        // An empty or fully repeated batch ends pagination instead of requesting it forever.
        current.exhausted = previousSize === current.items.length
        current.nextApiPage++
        current.updatedAt = now()
      })().finally(() => {
        current.pending = undefined
      })
      return current.pending
    }
    try {
      let batches = 0
      while (current.items.length < end && !current.exhausted) {
        if (batches++ >= MAX_BATCHES_PER_REQUEST) throw new Error('Search page is too far ahead; try the previous page first')
        await loadNextBatch()
      }
    } catch (error) {
      if (error instanceof UnsupportedSearchResponse) {
        if (sessions.get(key) === current) sessions.delete(key)
        return
      }
      // Preserve usable partial pages without issuing another request. If this page has no
      // records, surface the error once; plugin fallback would repeat the same slow request.
      if (start >= current.items.length) throw error
    }
    return {
      list: current.items.slice(start, end).map((music) => ({ ...music, meta: { ...music.meta, qualitys: {} } })),
      total: current.exhausted ? current.items.length : Math.ceil(current.items.length / limit) * limit + 1,
      page,
      limit,
    }
  }
}
