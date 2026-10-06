import { themeChangedEvent } from '@/shared/ipc/theme/event'

import * as commit from './commit'
import { themeState } from './state'

export const applyTheme = (colors: AnyListen.ThemeSetting['colors']) => {
  const root = document.documentElement
  root.classList.add('theme-changing')
  window.setTheme(colors)
  // Apply the new palette in one frame instead of animating every surface.
  root.getBoundingClientRect()
  requestAnimationFrame(() => root.classList.remove('theme-changing'))
}

export const setThemePreview = (preview: boolean) => {
  commit.setThemePreview(preview)
}

export const themePreview = (colors: AnyListen.ThemeSetting['colors'] | null) => {
  if (colors) {
    applyTheme(colors)
    setThemePreview(true)
  } else {
    applyTheme(themeState.theme.colors)
    setThemePreview(false)
  }
}

export const registerRemoteThemeAction = () => {
  return themeChangedEvent.on((theme) => {
    commit.updateTheme(theme)
    if (themeState.themePreview) return
    applyTheme(theme.colors)
  })
}

export { getThemeList, getThemeSetting } from '@/shared/ipc/theme'
