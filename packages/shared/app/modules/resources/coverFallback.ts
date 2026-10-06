import { withAbortSignal } from '@any-listen/common/abort'
import { resourceState } from './shared'
import { musicSearch } from './musicSearch'
import { allowedUrl } from './utils'
import { isMatchingCover } from './coverMatch'

const pending = new Map<string, Promise<string>>()
const missed = new Map<string, number>()
let active = 0
const waiting: Array<() => void> = []

export const findFallbackCover = async (musicInfo: AnyListen.Music.MusicInfo, excludedUrl?: string | null) => {
  const key = JSON.stringify([musicInfo.name, musicInfo.singer, musicInfo.meta.albumName, musicInfo.interval, excludedUrl])
  const existing = pending.get(key)
  if (existing) return existing
  if ((missed.get(key) ?? 0) > Date.now()) throw new Error('No matching cover recently found')
  // Visible rows can request many covers at once; do not flood the plugins.
  if (waiting.length >= 32) throw new Error('Cover lookup busy')
  const job = (async () => {
    if (active >= 3) await new Promise<void>((resolve) => waiting.push(resolve))
    else active++
    const sources = (resourceState.resources.musicSearch ?? [])
      .filter((source) => source.extensionId === 'online-metadata' || (source.extensionId === 'gdstudio' && source.id === 'gd-netease'))
      .sort((a, b) => {
        const rank = (id: string) => ['wy', 'tx', 'kg', 'kw', 'gd-netease'].indexOf(id)
        return (rank(a.id) < 0 ? 99 : rank(a.id)) - (rank(b.id) < 0 ? 99 : rank(b.id))
      }).slice(0, 3)
    for (const source of sources) {
      try {
        const result = await withAbortSignal(musicSearch({ extensionId: source.extensionId, source: source.id,
          name: musicInfo.name, artist: musicInfo.singer, page: 1, limit: 10 }), AbortSignal.timeout(2500))
        const match = result.list.find((candidate) => {
          const url = candidate.meta.picUrl
          return typeof url === 'string' && url !== excludedUrl && /^https?:\/\//.test(url) && allowedUrl(url) && isMatchingCover(musicInfo, candidate)
        })
        if (match?.meta.picUrl) return match.meta.picUrl
      } catch { /* Try the next enabled metadata provider. */ }
    }
    missed.set(key, Date.now() + 5 * 60_000)
    while (missed.size > 128) missed.delete(missed.keys().next().value!)
    throw new Error('No matching cover found')
  })().finally(() => {
    const next = waiting.shift()
    if (next) next()
    else active--
    pending.delete(key)
  })
  pending.set(key, job)
  return job
}
