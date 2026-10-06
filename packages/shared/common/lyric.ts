// Match complete LRC timestamps, not a partial timestamp followed by an error suffix (e.g. .00-1).
export const timedLyricLine = /^[\t ]*(?:\[\d{1,3}(?::\d{1,2}){1,2}(?:\.\d{1,3})?\])+[\t ]*\S/m

export const isValidLyric = (lyric?: string | null | number): lyric is string =>
  typeof lyric === 'string' && timedLyricLine.test(lyric)
