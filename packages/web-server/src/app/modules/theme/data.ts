import { STORE_NAMES } from '@any-listen/common/constants'
import themes from '@any-listen/theme/index.json'

import { appState } from '@/app/app'
import { getStore } from '@/app/shared/store'
import { joinPath } from '@/app/shared/utils'

let userThemes: AnyListen.Theme[] | undefined
const supportedThemes = themes.filter((theme) => theme.id === 'midnight' || theme.id === 'grey')
const legacyLightThemeIds = new Set([
  'green',
  'blue',
  'blue_plus',
  'orange',
  'red',
  'pink',
  'purple',
  'grey',
  'ming',
  'blue2',
  'mid_autumn',
  'naruto',
  'china_ink',
  'happy_new_year',
])

const getUserThemes = () => {
  userThemes ??= getStore(STORE_NAMES.THEME).get<AnyListen.Theme[]>('themes') ?? []
  return userThemes
}

export const getAllThemes = () => ({
  themes: supportedThemes,
  // Keep saved custom themes intact, but only offer the two supported appearances.
  userThemes: [],
  dataPath: joinPath(appState.dataPath, 'theme_images'),
})

export const saveTheme = (theme: AnyListen.Theme) => {
  const savedThemes = getUserThemes()
  const targetTheme = savedThemes.find((t) => t.id === theme.id)
  if (targetTheme) Object.assign(targetTheme, theme)
  else savedThemes.push(theme)
  getStore(STORE_NAMES.THEME).set('themes', savedThemes)
}

export const removeTheme = (id: string) => {
  const savedThemes = getUserThemes()
  const index = savedThemes.findIndex((t) => t.id === id)
  if (index < 0) return
  savedThemes.splice(index, 1)
  getStore(STORE_NAMES.THEME).set('themes', savedThemes)
}

export const resolveThemeId = (id: string, shouldUseDarkColors: boolean): 'midnight' | 'grey' => {
  if (id === 'auto') return shouldUseDarkColors ? 'midnight' : 'grey'
  if (legacyLightThemeIds.has(id)) return 'grey'
  return 'midnight'
}

export const getTheme = () => {
  const themeId = resolveThemeId(appState.appSetting['theme.id'], appState.shouldUseDarkColors)
  const theme = supportedThemes.find((theme) => theme.id === themeId)!

  return {
    id: themeId,
    name: theme.name,
    isDark: theme.isDark,
    colors: {
      ...theme.config.themeColors,
      ...theme.config.extInfo,
    },
  }
}
