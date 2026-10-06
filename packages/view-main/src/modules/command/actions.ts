import { VIEW_MAIN_ALL_COMMANDS } from '@any-listen/common/command'

import { commandEvent } from './event'

const localCommands = VIEW_MAIN_ALL_COMMANDS.filter((command) => command !== 'showMusicComment')

export const executeCommand = async (command: string, ...args: unknown[]): Promise<unknown> => {
  // Ignore saved shortcuts and remote requests for the removed comment feature.
  if (command === 'showMusicComment') return
  if (localCommands.includes(command as (typeof localCommands)[number])) {
    return commandEvent.viewMainCommand(command as (typeof localCommands)[number], ...args)
  }
  return commandEvent.mainCommand(command, ...args)
}

export const executeLocalCommand = async (cmd: (typeof VIEW_MAIN_ALL_COMMANDS)[number], ...args: unknown[]) => {
  if (cmd === 'showMusicComment') return
  return commandEvent.viewMainCommand(cmd, ...args)
}
