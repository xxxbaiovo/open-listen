type UrlInfo = AnyListen.IPCMusic.MusicUrlInfo

export const getFastLinkId = (musicInfo: AnyListen.Music.MusicInfo, quality: string): string | null => {
  if (musicInfo.isLocal || quality !== '128k') return null
  if (musicInfo.meta.source !== 'wy' && musicInfo.meta.source !== 'gd-netease') return null
  const id = String(musicInfo.meta.musicId)
  return /^\d+$/.test(id) ? id : null
}

// Session-only cache: old database URLs have no timestamp and cannot be trusted here.
export const createFastLinkResolver = (
  load: (id: string, signal: AbortSignal) => Promise<UrlInfo>,
  now = Date.now,
  timeout = 4000
) => {
  const cache = new Map<string, { value: UrlInfo; expires: number }>()
  const pending = new Map<string, { refresh: boolean; promise: Promise<UrlInfo>; controller: AbortController }>()
  return async (id: string, refresh: boolean, fallback: () => Promise<UrlInfo>): Promise<UrlInfo> => {
    if (refresh) cache.delete(id)
    const existing = pending.get(id)
    if (existing && (!refresh || existing.refresh)) return existing.promise
    const hit = cache.get(id)
    if (hit && hit.expires > now()) return { ...hit.value, isFromCache: true }
    cache.delete(id)
    const controller = new AbortController()
    const job = { refresh, controller, promise: null as unknown as Promise<UrlInfo> }
    job.promise = (async () => {
      let timer: ReturnType<typeof setTimeout> | undefined
      try {
        // Also enforce the deadline if the transport fails to settle on abort.
        const value = await Promise.race([
          Promise.resolve().then(async () => load(id, controller.signal)),
          new Promise<never>((_, reject) => {
            timer = setTimeout(() => {
              controller.abort()
              reject(new Error('Fast link timed out'))
            }, timeout)
          }),
        ])
        if (pending.get(id) === job) {
          cache.set(id, { value, expires: now() + 5 * 60_000 })
          while (cache.size > 64) cache.delete(cache.keys().next().value!)
        }
        return value
      } catch {
        // Keep the existing song matching/provider behavior as the final fallback.
        return await fallback()
      } finally {
        clearTimeout(timer)
        if (pending.get(id) === job) pending.delete(id)
      }
    })()
    pending.set(id, job)
    return job.promise
  }
}
