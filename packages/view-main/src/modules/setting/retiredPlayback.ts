import defaultSetting from '@any-listen/common/defaultSetting'

// Retired controls must not leave an imported or previously saved audio effect active.
export const normalizePlayback = <T extends Partial<AnyListen.AppSetting>>(setting: T): T => {
  const normalized = { ...setting }
  for (const key of Object.keys(setting) as Array<keyof AnyListen.AppSetting>) {
    if (key === 'player.playbackRate' || key === 'player.preservesPitch' || key.startsWith('player.soundEffect.')) {
      Object.assign(normalized, { [key]: defaultSetting[key] })
    }
  }
  return normalized
}
