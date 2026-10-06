import { themeEvent, themeState } from '@any-listen/app/modules/theme'

import { appEvent, appState, updateSetting } from '@/app/app'

import { getAllThemes, getTheme, removeTheme as removeThemeData, resolveThemeId, saveTheme as saveThemeData } from './data'

// The browser reports its system appearance after connecting; the server default is not authoritative.
let systemThemeReported = false

const normalizeThemeSetting = () => {
  const setting = appState.appSetting
  const id =
    setting['theme.id'] === 'auto' && !systemThemeReported
      ? 'auto'
      : resolveThemeId(setting['theme.id'], appState.shouldUseDarkColors)
  if (setting['theme.id'] === id && setting['theme.lightId'] === 'grey' && setting['theme.darkId'] === 'midnight') return false
  updateSetting({
    'theme.id': id,
    'theme.lightId': 'grey',
    'theme.darkId': 'midnight',
  })
  return true
}

export const migrateLegacyAutoTheme = () => {
  systemThemeReported = true
  normalizeThemeSetting()
}

export const initTheme = async () => {
  normalizeThemeSetting()
  Object.assign(themeState, getTheme())
  const watchConfigKeys: Array<keyof AnyListen.AppSetting> = ['theme.id', 'theme.lightId', 'theme.darkId']
  appEvent.on('updated_config', (keys) => {
    if (!keys.some((key) => watchConfigKeys.includes(key))) return
    // Normalization emits another settings event, which applies the corrected theme.
    if (normalizeThemeSetting()) return
    const theme = getTheme()
    if (theme.id === themeState.id) return
    Object.assign(themeState, theme)
    themeEvent.theme_change(themeState)
  })
}

export const getThemeSetting = () => {
  return themeState
}

export const getThemeList = () => {
  return getAllThemes()
}

export const saveTheme = (theme: AnyListen.Theme) => {
  saveThemeData(theme)
  themeEvent.theme_list_change(getAllThemes())
}

export const removeTheme = (id: string) => {
  removeThemeData(id)
  themeEvent.theme_list_change(getAllThemes())
}

export { themeEvent, themeState }
