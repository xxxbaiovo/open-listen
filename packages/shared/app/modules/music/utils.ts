import { checkFile } from '@any-listen/nodejs'

export { timedLyricLine as existTimeExp } from '@any-listen/common/lyric'

export const getLocalFilePath = async (musicInfo: AnyListen.Music.MusicInfoLocal) => {
  return (await checkFile(musicInfo.meta.filePath)) ? musicInfo.meta.filePath : null
}
