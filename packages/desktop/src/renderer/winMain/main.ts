import path from 'node:path'

import { DEV_SERVER_PORTS } from '@any-listen/common/constants'
import { getPlatform, getOSVersion } from '@any-listen/nodejs/index'
import { BrowserWindow, Notification, dialog, screen, session } from 'electron'

import { appState } from '@/app'
import { collectMusic, uncollectMusic } from '@/modules/player'
import { themeState } from '@/modules/theme'
import { encodePath } from '@/shared/electron'
import { openDevTools as handleOpenDevTools, throttle } from '@/shared/utils'

import { winMainEvent } from './event'
import { rendererIPC } from './rendererEvent'
import { winMainState } from './state'
import { createTaskBarButtons, getWindowSizeInfo } from './utils'
import { fitWindowBounds, readWindowBounds, saveWindowBounds } from './windowBounds'

let browserWindow: Electron.BrowserWindow | null = null
let resizeSession: { edge: string; cursor: Electron.Point; bounds: Electron.Rectangle } | null = null

export const resizeWindow = (phase: 'start' | 'move' | 'end', edge?: string, origin?: Electron.Point) => {
  if (!browserWindow || browserWindow.isMaximized() || browserWindow.isFullScreen()) {
    resizeSession = null
    return
  }
  if (phase === 'start') {
    if (!edge || !['n', 's', 'w', 'e', 'nw', 'ne', 'sw', 'se'].includes(edge)) return
    if (!origin || !Number.isFinite(origin.x) || !Number.isFinite(origin.y)) return
    // The pointer can already have moved by the time its IPC message arrives.
    resizeSession = { edge, cursor: origin, bounds: browserWindow.getBounds() }
    return
  }
  if (!resizeSession) return
  const { bounds, cursor, edge: direction } = resizeSession
  const point = screen.getCursorScreenPoint()
  const [minWidth, minHeight] = browserWindow.getMinimumSize()
  const next = { ...bounds }
  if (direction.includes('e')) next.width = Math.max(minWidth, bounds.width + point.x - cursor.x)
  if (direction.includes('s')) next.height = Math.max(minHeight, bounds.height + point.y - cursor.y)
  if (direction.includes('w')) {
    next.width = Math.max(minWidth, bounds.width - point.x + cursor.x)
    next.x = bounds.x + bounds.width - next.width
  }
  if (direction.includes('n')) {
    next.height = Math.max(minHeight, bounds.height - point.y + cursor.y)
    next.y = bounds.y + bounds.height - next.height
  }
  browserWindow.setBounds(next)
  if (phase === 'end') resizeSession = null
}

const winEvent = () => {
  if (!browserWindow) return
  const target = browserWindow
  let saveTimer: ReturnType<typeof setTimeout> | undefined
  const saveBounds = () => {
    clearTimeout(saveTimer)
    if (target.isDestroyed() || target.isFullScreen() || target.isMinimized()) return
    saveWindowBounds(path.join(appState.dataPath, 'window-bounds.json'), {
      ...target.getNormalBounds(), maximized: target.isMaximized(),
    })
  }
  const scheduleSave = () => {
    clearTimeout(saveTimer)
    saveTimer = setTimeout(saveBounds, 250)
  }
  target.on('resize', scheduleSave)
  target.on('move', scheduleSave)
  target.on('maximize', scheduleSave)
  target.on('unmaximize', scheduleSave)

  browserWindow.on('close', (event) => {
    saveBounds()
    if (appState.isSkipTrayQuit || !appState.appSetting['tray.enable']) {
      browserWindow!.setProgressBar(-1)
      winMainEvent.close()
      return
    }

    event.preventDefault()
    browserWindow!.hide()
  })

  browserWindow.on('closed', () => {
    clearTimeout(saveTimer)
    resizeSession = null
    browserWindow = null
  })

  // browserWindow.on('restore', () => {
  //   browserWindow.webContents.send('restore')
  // })
  browserWindow.on('focus', () => {
    winMainEvent.focus()
  })

  browserWindow.on('blur', () => {
    resizeSession = null
    winMainEvent.blur()
  })

  browserWindow.on('maximize', () => winMainEvent.maximized(true))
  browserWindow.on('unmaximize', () => winMainEvent.maximized(false))

  browserWindow.on('enter-full-screen', () => {
    winMainState.isFullScreen = true
    winMainEvent.fullscreen(true)
  })
  browserWindow.on('leave-full-screen', () => {
    winMainState.isFullScreen = false
    winMainEvent.fullscreen(false)

  })

  const handlerReadyToShow = () => {
    showWindow()
    setThumbarButtons()
    winMainEvent.ready_to_show()
  }

  // The `ready-to-show` event doesn't always fire on wayland.
  // Use the `did-finish-load` event on the web contents instead as that is similar enough
  // https://github.com/electron/electron/issues/48859
  // https://github.com/FreeTubeApp/FreeTube/pull/8294
  if (import.meta.env.VITE_IS_LINUX) {
    if (appState['electronParams.ozonePlatform'] == 'wayland') {
      browserWindow.webContents.once('did-finish-load', handlerReadyToShow)
    } else browserWindow.once('ready-to-show', handlerReadyToShow)
  } else {
    browserWindow.once('ready-to-show', handlerReadyToShow)
  }

  browserWindow.on('show', () => {
    winMainEvent.show()

    // 修复隐藏窗口后再显示时任务栏按钮丢失的问题
    setThumbarButtons()
  })
  browserWindow.on('hide', () => {
    winMainEvent.hide()
  })
}

export const createWindow = () => {
  closeWindow()
  const windowSizeInfo = getWindowSizeInfo(appState.appSetting['common.windowSizeId'])
  const savedBounds = readWindowBounds(path.join(appState.dataPath, 'window-bounds.json'))
  const restoredBounds = savedBounds ? fitWindowBounds(savedBounds, screen.getDisplayMatching(savedBounds).workArea) : null

  const theme = themeState
  const ses = session.fromPartition('persist:view-main')
  if (appState.proxy.host) {
    void ses.setProxy({
      proxyRules: `http://${appState.proxy.host}:${appState.proxy.port}`,
    })
  }

  const preloadUrl = path.join(encodePath(__dirname), './view-main.preload.js')

  /**
   * Initial window options
   */
  const options: Electron.BrowserWindowConstructorOptions = {
    height: windowSizeInfo.height,
    useContentSize: true,
    width: windowSizeInfo.width,
    frame: false,
    transparent: !appState.envParams.cmdParams.dt,
    hasShadow: appState.envParams.cmdParams.dt,
    // enableRemoteModule: false,
    // icon: join(appState.__static, isWin ? 'icons/256x256.ico' : 'icons/512x512.png'),
    roundedCorners: appState.envParams.cmdParams.dt,
    resizable: true,
    maximizable: true,
    minWidth: 800,
    minHeight: 540,
    fullscreenable: true,
    show: false,
    webPreferences: {
      preload: preloadUrl,
      session: ses,
      nodeIntegrationInWorker: true,
      contextIsolation: false,
      webSecurity: false,
      nodeIntegration: false,
      sandbox: false,
      enableWebSQL: false,
      webgl: false,
      spellcheck: false, // 禁用拼写检查器
    },
  }
  if (import.meta.env.VITE_IS_MAC) {
    options.frame = true
    options.titleBarStyle = 'hidden'
    options.trafficLightPosition = { x: 12, y: 8 }
  }
  if (appState.envParams.cmdParams.dt) options.backgroundColor = theme.colors['--color-primary-light-1000']
  if (restoredBounds) {
    Object.assign(options, restoredBounds)
    options.useContentSize = false
  }
  if (appState.appSetting['common.startInFullscreen']) {
    options.fullscreen = true
    winMainState.isFullScreen = true
    if (import.meta.env.VITE_IS_LINUX) options.resizable = true
  }
  browserWindow = new BrowserWindow(options)
  // Windows may adjust constructor dimensions for a frameless native shadow.
  // Apply the saved outer bounds after native window initialization as well.
  if (restoredBounds && !options.fullscreen && !savedBounds?.maximized) {
    const target = browserWindow
    target.once('ready-to-show', () => {
      target.setBounds(restoredBounds)
      const actual = target.getNormalBounds()
      const dw = actual.width - restoredBounds.width
      const dh = actual.height - restoredBounds.height
      if ((dw || dh) && Math.abs(dw) <= 8 && Math.abs(dh) <= 8) {
        target.setBounds({ ...restoredBounds, width: restoredBounds.width - dw, height: restoredBounds.height - dh })
      }
    })
  }

  const winURL = import.meta.env.DEV
    ? `http://localhost:${DEV_SERVER_PORTS['view-main']}`
    : `file://${path.join(encodePath(__dirname), '../view-main/index.html')}`
  if (import.meta.env.DEV) {
    void browserWindow.loadURL(
      `${winURL}?os=${getPlatform()}&osver=${encodeURIComponent(getOSVersion())}&dt=${appState.envParams.cmdParams.dt}`
    )
  } else {
    void browserWindow.loadURL(
      `${winURL}?os=${getPlatform()}&osver=${encodeURIComponent(getOSVersion())}&dt=${appState.envParams.cmdParams.dt}&t=${encodeURIComponent(JSON.stringify(theme.colors))}`
    )
  }

  winEvent()
  if (savedBounds?.maximized && !options.fullscreen) browserWindow.maximize()

  if (appState.envParams.cmdParams.odt) handleOpenDevTools(browserWindow.webContents)

  // browserWindow.webContents.openDevTools()
}

export const isExistWindow = (): boolean => !!browserWindow
export const isShowWindow = (): boolean => {
  if (!browserWindow) return false
  return import.meta.env.VITE_IS_WINDOWS ? browserWindow.isVisible() : browserWindow.isVisible() && browserWindow.isFocused()
}

export const closeWindow = () => {
  if (!browserWindow) return
  browserWindow.close()
}

export const setProxy = (host: string, port: string) => {
  if (!browserWindow) return
  if (host) {
    void browserWindow.webContents.session.setProxy({
      proxyRules: `http://${host}:${port}`,
    })
  } else {
    void browserWindow.webContents.session.setProxy({
      proxyRules: '',
    })
  }
}

export const showSelectDialog = async (options: Electron.OpenDialogOptions) => {
  if (!browserWindow) throw new Error('main window is undefined')
  return dialog.showOpenDialog(browserWindow, options)
}
export const showDialog = ({ type, message, detail }: Electron.MessageBoxSyncOptions) => {
  if (!browserWindow) return
  dialog.showMessageBoxSync(browserWindow, {
    type,
    message,
    detail,
  })
}
export const minimize = () => {
  if (!browserWindow) return
  browserWindow.minimize()
}
export const maximize = () => {
  if (!browserWindow) return
  browserWindow.maximize()
}
export const unmaximize = () => {
  if (!browserWindow) return
  browserWindow.unmaximize()
}
export const toggleHide = () => {
  if (!browserWindow) return
  if (appState.appSetting['tray.enable']) {
    browserWindow.isVisible() ? browserWindow.hide() : showWindow()
  } else {
    browserWindow.isMinimized() ? showWindow() : browserWindow.minimize()
  }
}
export const isMaximized = () => browserWindow?.isMaximized() ?? false
export const toggleMaximize = () => {
  if (!browserWindow || browserWindow.isFullScreen()) return
  if (browserWindow.isMaximized()) browserWindow.unmaximize()
  else browserWindow.maximize()
}
export const toggleMinimize = () => {
  if (!browserWindow) return
  if (browserWindow.isVisible()) {
    if (browserWindow.isMinimized()) browserWindow.restore()
    else browserWindow.minimize()
  } else browserWindow.show()
}
export const showWindow = () => {
  if (!browserWindow) return
  if (browserWindow.isVisible()) {
    if (browserWindow.isMinimized()) browserWindow.restore()
    else browserWindow.focus()
  } else browserWindow.show()
}
export const hideWindow = () => {
  if (!browserWindow) return
  if (appState.appSetting['tray.enable']) {
    browserWindow.hide()
  } else {
    browserWindow.minimize()
  }
}
export const setWindowBounds = (options: Partial<Electron.Rectangle>) => {
  if (!browserWindow) return
  browserWindow.setBounds(options)
}
export const setProgressBar = (progress: number, options?: Electron.ProgressBarOptions) => {
  if (!browserWindow) return
  browserWindow.setProgressBar(progress, options)
}
export const setIgnoreMouseEvents = (ignore: boolean, options?: Electron.IgnoreMouseEventsOptions) => {
  if (!browserWindow) return
  browserWindow.setIgnoreMouseEvents(ignore, options)
}
export const toggleDevTools = () => {
  if (!browserWindow) return
  if (browserWindow.webContents.isDevToolsOpened()) {
    browserWindow.webContents.closeDevTools()
  } else {
    handleOpenDevTools(browserWindow.webContents)
  }
}

export const setFullScreen = (isFullscreen: boolean): boolean => {
  if (!browserWindow) return false
  browserWindow.setFullScreen(isFullscreen)
  winMainState.isFullScreen = isFullscreen
  return isFullscreen
}

const taskBarButtonFlags: AnyListen.TaskBarButtonFlags = {
  empty: true,
  collect: false,
  play: false,
  next: true,
  prev: true,
}
export const setThumbarButtons = throttle(
  ({ empty, collect, play, next, prev }: AnyListen.TaskBarButtonFlags = taskBarButtonFlags) => {
    if (!import.meta.env.VITE_IS_WINDOWS) return
    if (!browserWindow) return
    taskBarButtonFlags.empty = empty
    taskBarButtonFlags.collect = collect
    taskBarButtonFlags.play = play
    taskBarButtonFlags.next = next
    taskBarButtonFlags.prev = prev
    browserWindow.setThumbarButtons(
      createTaskBarButtons(taskBarButtonFlags, (action) => {
        switch (action) {
          case 'collect':
            void collectMusic()
            break
          case 'unCollect':
            void uncollectMusic()
            break
          default:
            void rendererIPC.playerAction({ action })
            break
        }
      })
    )
  },
  50
)

export const setThumbnailClip = (region: Electron.Rectangle) => {
  if (!browserWindow) return
  browserWindow.setThumbnailClip(region)
}

export const clearCache = async () => {
  if (!browserWindow) throw new Error('main window is undefined')
  await browserWindow.webContents.session.clearCache()
}

export const getCacheSize = async () => {
  if (!browserWindow) throw new Error('main window is undefined')
  return browserWindow.webContents.session.getCacheSize()
}

export const getWebContents = () => {
  // if (!browserWindow) throw new Error('main window is undefined')
  return browserWindow?.webContents
}

/** 展示通知窗口 */
export const showNotification = async (title: string, message: string) => {
  if (!Notification.isSupported()) throw new Error('Notification is not supported')
  const notify = new Notification({
    title,
    body: message,
    icon: '',
  })
  notify.show()
}

/** 显示消息弹窗 */
export const showMessageBox = async (options: { type: Electron.MessageBoxOptions['type']; title: string; message: string }) => {
  if (!browserWindow) throw new Error('main window is undefined')
  return dialog.showMessageBox(browserWindow, options)
}

/** 显示错误消息弹窗 */
export const showErrorBox = (title: string, message: string) => {
  dialog.showErrorBox(title, message)
}

/** 显示打开弹窗 */
export const showOpenDialog = async (options: {
  title: Electron.OpenDialogOptions['title']
  defaultPath?: Electron.OpenDialogOptions['defaultPath']
  buttonLabel?: Electron.OpenDialogOptions['buttonLabel']
  filters?: Electron.OpenDialogOptions['filters']
  properties?: Electron.OpenDialogOptions['properties']
}) => {
  if (!browserWindow) throw new Error('main window is undefined')
  return dialog.showOpenDialog(browserWindow, options)
}

/** 显示保存弹窗 */
export const showSaveDialog = async ({
  selectFolder,
  ...options
}: {
  title: Electron.SaveDialogOptions['title']
  defaultPath?: Electron.SaveDialogOptions['defaultPath']
  buttonLabel?: Electron.SaveDialogOptions['buttonLabel']
  filters?: Electron.SaveDialogOptions['filters']
  properties?: Electron.SaveDialogOptions['properties']
  selectFolder?: boolean
}): Promise<Electron.SaveDialogReturnValue> => {
  if (!browserWindow) throw new Error('main window is undefined')
  if (selectFolder) {
    const openDialogResult = await dialog.showOpenDialog(browserWindow, {
      title: options.title,
      defaultPath: options.defaultPath,
      buttonLabel: options.buttonLabel,
      filters: options.filters,
      properties: ['openDirectory', 'createDirectory'],
    })
    if (openDialogResult.canceled) return { canceled: true, filePath: '' }
    return { canceled: false, filePath: openDialogResult.filePaths[0] }
  }
  return dialog.showSaveDialog(browserWindow, options)
}
