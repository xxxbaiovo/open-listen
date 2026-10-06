import { settingEvent } from './event'
import { settingState } from './state'
import { normalizePlayback } from '../retiredPlayback'

export const initSetting = (newSetting: AnyListen.AppSetting) => {
  newSetting = normalizePlayback(newSetting)
  settingState.setting = newSetting
  settingEvent.inited()
  settingEvent.updated(Object.keys(newSetting) as Array<keyof AnyListen.AppSetting>, newSetting)
}

const mergeSetting = (newSetting: Partial<AnyListen.AppSetting>) => {
  for (const [key, value] of Object.entries(newSetting)) {
    // @ts-expect-error
    settingState.setting[key] = value
  }
}
export const updateSetting = (keys: Array<keyof AnyListen.AppSetting>, setting: Partial<AnyListen.AppSetting>) => {
  setting = normalizePlayback(setting)
  mergeSetting(setting)
  settingEvent.updated(keys, setting)
}
