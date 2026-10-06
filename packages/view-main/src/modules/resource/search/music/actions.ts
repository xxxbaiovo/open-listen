import { musicSearch } from '@/shared/ipc/resource'
import { buildMusicQueryKey, buildMusicRequestKey, buildMusicSourceKey } from './pageCache'
import { musicState } from './state'

export const buildRequestKey = buildMusicRequestKey

export const parseRequestKey = (params: string) => {
  try {
    return JSON.parse(params) as {
      extId: string
      source: string
      page: number
      limit: number
      text: string
      artist?: string
    }
  } catch {
    return null
  }
}

export const resetListInfo = (extId: string, source: string) => {
  musicState.cache.clearScope(buildMusicSourceKey(extId, source))
}
export const resetAllListInfo = () => {
  musicState.cache.clear()
}

/* eslint-disable @typescript-eslint/max-params -- Keep the existing six-argument API compatible and add optional reload control. */
export const search = (
  extensionId: string,
  source: string,
  name: string,
  artist: string,
  page: number,
  limit: number,
  options: { force?: boolean } = {}
): {
  promise: Promise<AnyListen.IPCResource.MusicListResult>
  result?: AnyListen.IPCResource.MusicListResult
  total: number
} => {
  if (!name.trim().length) {
    const result = { list: [], total: 0, limit, page }
    return { promise: Promise.resolve(result), result, total: 0 }
  }
  const queryKey = buildMusicQueryKey(extensionId, source, limit, name, artist)
  const previous = musicState.cache.latest(queryKey)
  const response = musicState.cache.request(
    buildRequestKey(extensionId, source, page, limit, name, artist),
    queryKey,
    buildMusicSourceKey(extensionId, source),
    async () => musicSearch({ extensionId, source, name, artist, limit, page }),
    options.force
  )
  return { ...response, total: response.result?.total ?? previous?.total ?? 0 }
}
/* eslint-enable @typescript-eslint/max-params */

// Only the visible search page calls this once for its immediate next page.
// Sharing one slot prevents overlapping speculative requests across searches.
export const prefetchPage = (
  extensionId: string,
  source: string,
  name: string,
  artist: string,
  page: number,
  limit: number
) => {
  if (musicState.prefetchPromise) return
  const { promise, result } = search(extensionId, source, name, artist, page, limit)
  if (result) return
  musicState.prefetchPromise = promise
  void promise
    .catch(() => {})
    .finally(() => {
      if (musicState.prefetchPromise === promise) musicState.prefetchPromise = null
    })
}

export { findMusic } from '@/shared/ipc/resource'
