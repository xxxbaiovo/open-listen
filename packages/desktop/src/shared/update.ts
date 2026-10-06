import { getLatestVersion } from '@any-listen/common/tools'

import { appEvent, appState } from '../app'
import { checkUpdate, downloadUpdate, initUpdate, restartUpdate } from './electronUpdate'
import { request } from './request'
import { compareVersions, sleep } from './utils'

interface EventTypes {
  checking_for_update: never
  update_available: AnyListen.UpdateInfo
  update_not_available: AnyListen.UpdateInfo
  download_progress: AnyListen.DownloadProgressInfo
  update_downloaded: never
  error: Error
  ignore_version: string | null
}

type Listener = (event: unknown) => void
class UpdateEvent {
  private readonly listeners: Map<keyof EventTypes, Listener[]>
  constructor() {
    this.listeners = new Map()
  }
  off<T extends keyof EventTypes>(eventName: T, listener: (event: EventTypes[T]) => void) {
    let targetListeners = this.listeners.get(eventName)
    if (!targetListeners) return
    const index = targetListeners.indexOf(listener as Listener)
    if (index < 0) return
    targetListeners.splice(index, 1)
  }
  on<T extends keyof EventTypes>(eventName: T, listener: (event: EventTypes[T]) => void) {
    let targetListeners = this.listeners.get(eventName)
    if (!targetListeners) this.listeners.set(eventName, (targetListeners = []))
    targetListeners.push(listener as Listener)
    return () => {
      this.off(eventName, listener as Listener)
    }
  }
  emit<T extends keyof EventTypes>(eventName: T, ...[event]: EventTypes[T] extends never ? [] : [event: EventTypes[T]]) {
    setImmediate(() => {
      let targetListeners = this.listeners.get(eventName)
      if (!targetListeners) return
      for (const listener of Array.from(targetListeners)) {
        listener(event)
      }
    })
  }
}

// Version metadata is published together with the installer, never ahead of it.
const updateInfoUrl = 'https://github.com/xxxbaiovo/open-listen/releases/latest/download/version.json'

export const getUpdateInfo = async (): Promise<AnyListen.UpdateInfo> => {
  const { body } = await request<Partial<AnyListen.UpdateInfo>>(updateInfoUrl)
  if (typeof body.version !== 'string' || !Array.isArray(body.history)) {
    throw new Error('Invalid Any Listen update metadata')
  }
  return body as AnyListen.UpdateInfo
}

export class Update extends UpdateEvent {
  private info: AnyListen.UpdateInfo | null = null
  initUpdate() {
    initUpdate(this)
    appEvent.on('updated_config', (keys, settings) => {
      if (keys.includes('common.allowPreRelease')) {
        void this.checkUpdateStatus(appState.appSetting['common.tryAutoUpdate'])
      }
    })
  }
  async checkUpdateStatus(isAutoUpdate: boolean) {
    if (!this.info) return false
    const latest = getLatestVersion(this.info, appState.appSetting['common.allowPreRelease'])
    if (compareVersions(appState.version.version, latest.version) < 0) {
      await checkUpdate(appState.appSetting['common.allowPreRelease'])
        .then(() => {
          if (isAutoUpdate) {
            setImmediate(() => {
              void downloadUpdate()
            })
          }
        })
        .catch((error) => {
          setImmediate(() => {
            this.emit('error', error as Error)
          })
        })
      this.emit('update_available', this.info)
      return true
    }
    this.emit('update_not_available', this.info)
    return false
  }
  async checkForUpdates(isAutoUpdate: boolean) {
    this.emit('checking_for_update')
    try {
      this.info = await getUpdateInfo()
    } catch (err) {
      this.emit('error', err as Error)
      return false
    }

    return this.checkUpdateStatus(isAutoUpdate)
  }
  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  async downloadUpdate() {
    await downloadUpdate()
  }
  async isUpdateAvailable() {
    return this.checkForUpdates(false)
  }
  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  async quitAndInstall() {
    await restartUpdate()
  }
}
export const update = new Update()

export const startCheckUpdateTimeout = async (): Promise<void> => {
  await update.checkForUpdates(appState.appSetting['common.tryAutoUpdate']).catch(() => {})
  await sleep(86400_000)
  return startCheckUpdateTimeout()
}
