type PlayMode = AnyListen.AppSetting['player.togglePlayMethod']

export const PLAY_MODES: readonly PlayMode[] = ['list', 'listLoop', 'random', 'singleLoop', 'none']

const presentation = {
  list: { icon: 'list-order', active: false },
  listLoop: { icon: 'list-loop', active: true },
  random: { icon: 'list-random', active: true },
  singleLoop: { icon: 'list-single-loop', active: true },
  none: { icon: 'unavailable', active: false },
} satisfies Record<PlayMode, { icon: string; active: boolean }>

export const getNextPlayMode = (mode: PlayMode): PlayMode => PLAY_MODES[(PLAY_MODES.indexOf(mode) + 1) % PLAY_MODES.length]

export const getPlayModePresentation = (mode: PlayMode) => presentation[mode]

/** Share one controller across players so rapid clicks advance from the last intent. */
const createQueuedSelection = <T>(readMode: () => T, writeMode: (mode: T) => Promise<void>, equal: (a: T, b: T) => boolean) => {
  let cursor: T | undefined
  let pending = 0
  let tail = Promise.resolve()
  const awaitingEcho: Array<{ mode: T }> = []

  const observe = (mode: T) => {
    const echoedIndex = awaitingEcho.findIndex((request) => equal(request.mode, mode))
    if (echoedIndex >= 0) awaitingEcho.splice(0, echoedIndex + 1)
    // A remote change wins once the local queue has settled. Intermediate echoes
    // must not move the cursor backwards when an IPC acknowledgement arrives first.
    if (!pending && (echoedIndex < 0 || !awaitingEcho.length)) {
      cursor = undefined
      awaitingEcho.length = 0
    }
  }

  const select = async (mode: T): Promise<void> => {
    if (equal(mode, cursor ?? readMode())) return Promise.resolve()
    cursor = mode
    pending++
    const request = { mode }
    const result = tail.then(async () => {
      awaitingEcho.push(request)
      try {
        await writeMode(mode)
      } catch (error) {
        const index = awaitingEcho.indexOf(request)
        if (index >= 0) awaitingEcho.splice(index, 1)
        if (pending == 1) {
          cursor = undefined
          awaitingEcho.length = 0
        }
        throw error
      } finally {
        pending--
        // Once all writes and echoes finish, respect any newer remote setting.
        if (!pending && !awaitingEcho.length) {
          cursor = undefined
          awaitingEcho.length = 0
        }
      }
    })
    // Keep later clicks usable after a failed write; the caller still receives
    // the rejected result for the failed operation.
    tail = result.catch(() => {})
    return result
  }

  return {
    select,
    current: () => cursor ?? readMode(),
    observe,
  }
}

export const createPlayModeController = (readMode: () => PlayMode, writeMode: (mode: PlayMode) => Promise<void>) => {
  const controller = createQueuedSelection(readMode, writeMode, (a, b) => a === b)
  return { ...controller, next: async () => controller.select(getNextPlayMode(controller.current())) }
}

export interface PlaybackOptions {
  shuffle: boolean
  repeat: 'off' | 'all' | 'one'
}

export const readPlaybackOptions = (mode: PlayMode, shuffle = false): PlaybackOptions => ({
  shuffle: shuffle || mode === 'random',
  repeat: mode === 'singleLoop' ? 'one' : mode === 'listLoop' || mode === 'random' ? 'all' : 'off',
})

export const repeatPlayMode = (repeat: PlaybackOptions['repeat']): PlayMode =>
  repeat === 'one' ? 'singleLoop' : repeat === 'all' ? 'listLoop' : 'list'

// Natural track endings honor repeat-one before shuffle; manual skips still move.
export const resolvePlaybackMethod = (mode: PlayMode, shuffle: boolean, automatic = true): PlayMode => {
  const options = readPlaybackOptions(mode, shuffle)
  if (automatic && options.repeat === 'one') return 'singleLoop'
  if (options.shuffle) return 'random'
  return repeatPlayMode(options.repeat)
}

export const createPlaybackOptionsController = (
  read: () => PlaybackOptions,
  write: (options: PlaybackOptions) => Promise<void>
) => {
  const controller = createQueuedSelection(read, write, (a, b) => a.shuffle === b.shuffle && a.repeat === b.repeat)
  return {
    observe: controller.observe,
    select: async (mode: PlayMode) => controller.select(readPlaybackOptions(mode)),
    next: async () => {
      const current = controller.current()
      return controller.select(readPlaybackOptions(getNextPlayMode(current.shuffle ? 'random' : repeatPlayMode(current.repeat))))
    },
    toggleShuffle: async () => {
      const current = controller.current()
      return controller.select({ ...current, shuffle: !current.shuffle })
    },
    nextRepeat: async () => {
      const current = controller.current()
      return controller.select({ ...current, repeat: current.repeat === 'off' ? 'all' : current.repeat === 'all' ? 'one' : 'off' })
    },
  }
}

export const pickShuffleTrack = <T extends { itemId: string; played: boolean }>(
  list: T[], currentId: string | undefined, repeat: PlaybackOptions['repeat'], automatic: boolean, random = Math.random
): { track: T; newCycle: boolean } | null => {
  const unplayed = list.filter((track) => !track.played && track.itemId !== currentId)
  if (unplayed.length) return { track: unplayed[Math.floor(random() * unplayed.length)], newCycle: false }
  if (!list.length || (automatic && repeat === 'off')) return null
  const others = list.filter((track) => track.itemId !== currentId)
  const pool = others.length ? others : list
  return { track: pool[Math.floor(random() * pool.length)], newCycle: true }
}
