const normalize = (value: string) => value.normalize('NFKC').toLocaleLowerCase().replace(/[^\p{L}\p{N}]/gu, '')
const seconds = (value: string | null) => {
  if (!value || !/^\d+(?::\d{2}){1,2}$/.test(value)) return null
  return value.split(':').reduce((total, part) => total * 60 + Number(part), 0)
}

// Keep version words (live, remix, acoustic) and require the complete artist credit.
export const isMatchingCover = (original: AnyListen.Music.MusicInfo, candidate: AnyListen.Music.MusicInfo) => {
  const name = normalize(original.name)
  const singer = normalize(original.singer)
  if (!name || !singer || name !== normalize(candidate.name) || singer !== normalize(candidate.singer)) return false
  const album = normalize(original.meta.albumName || '')
  const otherAlbum = normalize(candidate.meta.albumName || '')
  if (album && (!otherAlbum || album !== otherAlbum)) return false
  const duration = seconds(original.interval)
  const otherDuration = seconds(candidate.interval)
  return duration === null || otherDuration === null || Math.abs(duration - otherDuration) <= 4
}
