import { findMusic as findMusicByExt } from './search/music'
import { withAbortSignal } from '@any-listen/common/abort'
import { buildExtSourceId, getExtSource, getSourceAllExtSourceIds } from './utils'

const findSourceMusic = async <T>(
  info: {
    name: string
    singer: string
    albumName: string
    interval: string | null
  },
  handler: (info: AnyListen.Music.MusicInfoOnline) => Promise<T>,
  excludeList: string[] = [],
  signal?: AbortSignal
): Promise<T> => {
  signal?.throwIfAborted()
  const source = getExtSource('musicSearch', excludeList)
  // console.log('excludeList', excludeList, source)
  if (!source) throw new Error('Get url failed, no source')
  const music = await withAbortSignal(findMusicByExt({ extensionId: source.extensionId, source: source.id, ...info }), signal)
  if (music) {
    try {
      return await withAbortSignal(handler(music), signal)
    } catch (e) {
      console.error(e)
    }
  }
  excludeList.push(buildExtSourceId(source.extensionId, source.id))
  return findSourceMusic(info, handler, excludeList, signal)
}

const handleFindMusic = async <T>(
  musicInfo: {
    name: string
    singer: string
    albumName: string
    interval: string | null
    rawName?: string
    source?: string
  },
  handler: (info: AnyListen.Music.MusicInfoOnline) => Promise<T>,
  signal?: AbortSignal
) => {
  signal?.throwIfAborted()
  const excludeList: string[] = musicInfo.source ? getSourceAllExtSourceIds('musicSearch', musicInfo.source) : []
  try {
    return await findSourceMusic<T>(
      {
        name: musicInfo.name,
        singer: musicInfo.singer,
        albumName: musicInfo.albumName,
        interval: musicInfo.interval,
      },
      handler,
      [...excludeList], signal
    )
  } catch {}
  if (musicInfo.name.includes('-')) {
    const [name, singer] = musicInfo.name.split('-').map((val) => val.trim())
    try {
      return await findSourceMusic<T>(
        {
          name,
          singer,
          albumName: musicInfo.albumName,
          interval: musicInfo.interval,
        },
        handler,
        [...excludeList], signal
      )
    } catch {}
    try {
      return await findSourceMusic<T>(
        {
          name: singer,
          singer: name,
          albumName: musicInfo.albumName,
          interval: musicInfo.interval,
        },
        handler,
        [...excludeList], signal
      )
    } catch {}
  }
  let fileName = musicInfo.rawName
  if (fileName) {
    fileName = fileName.substring(0, fileName.lastIndexOf('.'))
    if (fileName != musicInfo.name) {
      if (fileName.includes('-')) {
        const [name, singer] = fileName.split('-').map((val) => val.trim())
        try {
          return await findSourceMusic<T>(
            {
              name,
              singer,
              albumName: musicInfo.albumName,
              interval: musicInfo.interval,
            },
            handler,
            [...excludeList], signal
          )
        } catch {}
        try {
          return await findSourceMusic<T>(
            {
              name: singer,
              singer: name,
              albumName: musicInfo.albumName,
              interval: musicInfo.interval,
            },
            handler,
            [...excludeList], signal
          )
        } catch {}
      } else {
        try {
          return await findSourceMusic<T>(
            {
              name: fileName,
              singer: '',
              albumName: musicInfo.albumName,
              interval: musicInfo.interval,
            },
            handler,
            [...excludeList], signal
          )
        } catch {}
      }
    }
  }

  throw new Error('source not found')
}

const findMusicByLocal = async <T>(
  musicInfo: AnyListen.Music.MusicInfoLocal,
  handler: (info: AnyListen.Music.MusicInfoOnline) => Promise<T>,
  signal?: AbortSignal
) => {
  return handleFindMusic(
    {
      name: musicInfo.name,
      singer: musicInfo.singer,
      albumName: musicInfo.meta.albumName,
      interval: musicInfo.interval,
      rawName: musicInfo.meta.filePath.split(/\/|\\/).at(-1),
    },
    handler, signal
  )
}

const findMusicByOnline = async <T>(
  musicInfo: AnyListen.Music.MusicInfoOnline,
  handler: (info: AnyListen.Music.MusicInfoOnline) => Promise<T>,
  signal?: AbortSignal
) => {
  return handleFindMusic(
    {
      name: musicInfo.name,
      singer: musicInfo.singer,
      albumName: musicInfo.meta.albumName,
      interval: musicInfo.interval,
      rawName: musicInfo.meta.fileName,
      source: musicInfo.meta.source,
    },
    handler, signal
  )
}

export const findMusic = async <T>(
  musicInfo: AnyListen.Music.MusicInfo,
  handler: (info: AnyListen.Music.MusicInfoOnline) => Promise<T>,
  signal?: AbortSignal
) => {
  signal?.throwIfAborted()
  if (musicInfo.isLocal) {
    return findMusicByLocal(musicInfo, async (info) => {
      return handler(info)
    }, signal)
  }
  try {
    return await withAbortSignal(handler(musicInfo), signal)
  } catch {}
  return findMusicByOnline(musicInfo, handler, signal)
}
