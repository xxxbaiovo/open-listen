import { services } from '../resources/shared'
import { findMusic } from './tools'
import { allowedUrl, buildExtSourceId, getExtSource } from './utils'
import { withAbortSignal } from '@any-listen/common/abort'
import { findFallbackCover } from './coverFallback'

export const musicPicSearch = async ({
  extensionId,
  source,
  name,
  artist,
}: {
  extensionId: string
  source: string
  name: string
  artist?: string
}): Promise<string[]> => {
  return services.extensionSerive
    .resourceAction('musicPicSearch', {
      extensionId,
      source,
      name,
      artist,
    })
    .then((result) => {
      // console.log(result)
      return result
    })
}

export const getMusicPicByExtensionSource = async ({
  extensionId,
  source,
  musicInfo,
}: {
  extensionId: string
  source: string
  musicInfo: AnyListen.Music.MusicInfoOnline
}): Promise<string> => {
  return services.extensionSerive
    .resourceAction('musicPic', {
      extensionId,
      source,
      musicInfo,
    })
    .then((result) => {
      // console.log(result)
      if (!result) throw new Error('Get music pic failed')
      if (!allowedUrl(result)) throw new Error('Get music pic failed, url not allowed')
      return result
    })
}

const handleGetMusicPic = async (
  {
    musicInfo,
  }: {
    musicInfo: AnyListen.Music.MusicInfoOnline
  },
  excludeList: string[] = []
): Promise<string> => {
  const source = getExtSource('musicPic', excludeList, musicInfo.meta.source)
  if (!source) throw new Error('Get url failed, no source')
  return getMusicPicByExtensionSource({
    extensionId: source.extensionId,
    source: source.id,
    musicInfo,
  }).catch(async (e) => {
    console.error(e)
    excludeList.push(buildExtSourceId(source.extensionId, source.id))
    return handleGetMusicPic({ musicInfo }, excludeList)
  })
}

export const getMusicPic = async (data: { musicInfo: AnyListen.Music.MusicInfo; excludedUrl?: string | null }): Promise<string> => {
  const signal = AbortSignal.timeout(4000)
  try {
    return await withAbortSignal(findMusic(data.musicInfo, async (musicInfo) => {
      const url = await withAbortSignal(handleGetMusicPic({ musicInfo }), signal)
      if (url === data.excludedUrl) throw new Error('Previously failed cover')
      return url
    }, signal), signal)
  } catch {
    return findFallbackCover(data.musicInfo, data.excludedUrl)
  }
}
