import { isValidLyric } from '@any-listen/common/tools'
import { withAbortSignal } from '@any-listen/common/abort'

import { services } from './shared'
import { findMusic } from './tools'
import { buildExtSourceId, getExtSource } from './utils'

export const lyricSearch = async ({
  extensionId,
  source,
  name,
  artist,
  interval,
}: {
  extensionId: string
  source: string
  name: string
  artist?: string
  interval?: number
}): Promise<AnyListen.IPCExtension.LyricSearchResult[]> => {
  // console.log(extensionId, source, name, artist, interval)
  if (!name.trim().length) return []
  return services.extensionSerive
    .resourceAction('lyricSearch', {
      extensionId,
      source,
      name,
      artist,
      interval,
    })
    .then((result) => {
      // console.log(result)
      return result
    })
}
export const getLyric = async ({
  extensionId,
  source,
  id,
}: {
  extensionId: string
  source: string
  id: string
}): Promise<AnyListen.Music.LyricInfo> => {
  return services.extensionSerive
    .resourceAction('lyricDetail', {
      extensionId,
      source,
      id,
    })
    .then((result) => {
      // console.log(result)
      return result
    })
}

export const getMusicLyricByExtensionSource = async ({
  extensionId,
  source,
  musicInfo,
  signal,
}: {
  extensionId: string
  source: string
  musicInfo: AnyListen.Music.MusicInfoOnline
  signal?: AbortSignal
}): Promise<AnyListen.Music.LyricInfo> => {
  signal?.throwIfAborted()
  const deadline = signal ? AbortSignal.any([signal, AbortSignal.timeout(6000)]) : AbortSignal.timeout(6000)
  return withAbortSignal(services.extensionSerive.resourceAction('musicLyric', {
      extensionId,
      source,
      musicInfo,
    }), deadline)
    .then((result) => {
      // console.log(result)
      if (!isValidLyric(result.lyric)) throw new Error('Get music lyric failed')
      return result
    })
}

const handleGetMusicLyric = async (
  {
    musicInfo,
  }: {
    musicInfo: AnyListen.Music.MusicInfoOnline
  },
  excludeList: string[] = [],
  signal?: AbortSignal
): Promise<AnyListen.Music.LyricInfo> => {
  signal?.throwIfAborted()
  const source = getExtSource('musicLyric', excludeList, musicInfo.meta.source)
  if (!source) throw new Error('Get url failed, no, source')
  return getMusicLyricByExtensionSource({
    extensionId: source.extensionId,
    source: source.id,
    musicInfo,
    signal,
  }).catch(async (e) => {
    console.error(e)
    excludeList.push(buildExtSourceId(source.extensionId, source.id))
    return handleGetMusicLyric({ musicInfo }, excludeList, signal)
  })
}

export const getMusicLyric = async (data: { musicInfo: AnyListen.Music.MusicInfo }): Promise<AnyListen.Music.LyricInfo> => {
  const signal = AbortSignal.timeout(20_000)
  return findMusic(data.musicInfo, async (musicInfo) => {
    const primary = handleGetMusicLyric({ musicInfo }, [], signal)
    // GD NetEase uses the same numeric track IDs as Online Metadata's NetEase provider.
    // Try that exact recording before a slower search for matching songs on other platforms.
    const alternate = musicInfo.meta.source === 'gd-netease' && /^\d+$/.test(musicInfo.meta.musicId)
      ? getExtSource('musicLyric', [], 'wy') : undefined
    if (!alternate) return primary
    return Promise.any([primary, getMusicLyricByExtensionSource({
      extensionId: alternate.extensionId,
      source: alternate.id,
      musicInfo: { ...musicInfo, meta: { ...musicInfo.meta, source: 'wy' } },
      signal,
    })])
  }, signal)
}
