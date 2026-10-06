interface BufferedTrack {
  trackId: string
  sourceUrl: string
  objectUrl: string
}

// One upcoming track in memory. The player owns a consumed blob until it stops.
export const createAudioPreload = (maxBytes = 48 * 1024 * 1024, timeout = 30_000, fetcher = fetch) => {
  let ready: BufferedTrack | null = null
  let pending: AbortController | null = null
  const suspend = () => {
    pending?.abort()
    pending = null
  }
  const cancel = (keepTrackId?: string) => {
    suspend()
    if (ready && ready.trackId !== keepTrackId) {
      URL.revokeObjectURL(ready.objectUrl)
      ready = null
    }
  }
  const prepare = async (trackId: string, sourceUrl: string, requestUrl: string): Promise<boolean> => {
    if (ready?.trackId === trackId && ready.sourceUrl === sourceUrl) return true
    cancel()
    const controller = new AbortController()
    pending = controller
    const timer = setTimeout(() => { controller.abort() }, timeout)
    try {
      const response = await fetcher(requestUrl, { signal: controller.signal, cache: 'force-cache' })
      const type = response.headers.get('content-type') ?? ''
      if (!response.ok || response.status === 206 || /text\/|json|mpegurl/i.test(type) || !response.body) return false
      if (Number(response.headers.get('content-length')) > maxBytes) return false
      const reader = response.body.getReader()
      const chunks: Array<Uint8Array<ArrayBuffer>> = []
      let size = 0
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        size += value.byteLength
        if (size > maxBytes || controller.signal.aborted) return false
        chunks.push(new Uint8Array(value))
      }
      if (!size || controller.signal.aborted || pending !== controller) return false
      // eslint-disable-next-line require-atomic-updates -- The controller identity above rejects obsolete requests.
      ready = { trackId, sourceUrl, objectUrl: URL.createObjectURL(new Blob(chunks, { type })) }
      return true
    } catch {
      // A preload must never interrupt the current song or block a manual skip.
      return false
    } finally {
      clearTimeout(timer)
      controller.abort()
      if (pending === controller) pending = null
    }
  }
  const take = (sourceUrl: string) => {
    if (ready?.sourceUrl !== sourceUrl) return null
    const track = ready
    ready = null
    return { url: track.objectUrl, release: () => { URL.revokeObjectURL(track.objectUrl) } }
  }
  return { prepare, cancel, suspend, take }
}

export const audioPreload = createAudioPreload()
