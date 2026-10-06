/** Returns a total only when every track provides a valid duration. */
export const getPlaylistDuration = (list: ReadonlyArray<{ interval?: string | null }>): number | null => {
  if (!list.length) return null

  let totalSeconds = 0
  for (const { interval } of list) {
    if (typeof interval !== 'string') return null
    const value = interval.trim()
    // The first field is unbounded: 120:30 means 120 minutes, while 2:00:30 includes hours.
    if (!/^\d+:[0-5]\d(?::[0-5]\d)?$/.test(value)) return null
    const seconds = value.split(':').reduce((total, part) => total * 60 + Number(part), 0)
    if (!Number.isSafeInteger(seconds)) return null
    totalSeconds += seconds
    if (!Number.isSafeInteger(totalSeconds)) return null
  }

  return totalSeconds
}
