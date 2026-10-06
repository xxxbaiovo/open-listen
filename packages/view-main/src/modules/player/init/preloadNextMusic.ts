import { buildUrl } from '@any-listen/web'

import { onRelease } from '@/modules/app/shared'
import { appState } from '@/modules/app/store/state'
import { settingEvent } from '@/modules/setting/store/event'
import { settingState } from '@/modules/setting/store/state'
import { createUnsubscriptionSet } from '@/shared'
import { audioPreload } from '@/shared/audioPreload'

import { onPlayerCreated } from '../shared'
import { playerEvent } from '../store/event'
import { getNextPlayMusicInfo, resetRandomNextMusicInfo } from '../store/playerActions'
import { getMusicLyric, getMusicUrl } from '../store/playerRemoteAction'
import { playerState } from '../store/state'

const unregistered = createUnsubscriptionSet()
export const initPreloadNextMusic = () => {
  let revision = 0
  let timer: ReturnType<typeof setTimeout> | undefined
  let attempted = false
  let queueSignature = ''
  const clearTimer = () => {
    clearTimeout(timer)
    timer = undefined
  }
  const preload = async () => {
    if (attempted || !playerState.playing || !playerState.playerPlaying || playerState.isPlayedStop) return
    attempted = true
    const version = revision
    const currentId = playerState.playMusicInfo?.itemId
    const isCurrent = () => version === revision && currentId === playerState.playMusicInfo?.itemId
    try {
      const next = await getNextPlayMusicInfo()
      if (!next || !isCurrent() || next.musicInfo.id === playerState.musicInfo.id || next.musicInfo.isLocal) return
      // Save lyrics in the normal local cache, without touching the visible song.
      void getMusicLyric({ musicInfo: next.musicInfo }).catch(() => {})
      const { url } = await getMusicUrl({ musicInfo: next.musicInfo })
      if (!url || !isCurrent()) return
      await audioPreload.prepare(next.musicInfo.id, url,
        buildUrl(url, settingState.setting['network.proxyAllResources'], appState.proxyServerHost))
    } catch {
      // Foreground playback retains its normal retry/fallback path.
    }
  }
  const schedule = () => {
    clearTimer()
    // Establish current playback before using background bandwidth.
    timer = setTimeout(() => { timer = undefined; void preload() }, 1500)
  }
  const invalidate = () => {
    revision++
    attempted = false
    clearTimer()
    // Keep a completed buffer when its track has just become the current song.
    audioPreload.cancel(playerState.playMusicInfo?.musicInfo.id)
    resetRandomNextMusicInfo()
    schedule()
  }
  const queueChanged = () => {
    // Metadata/picture updates must not reroll a reserved random track.
    const signature = playerState.playList.map((m) => `${m.itemId}:${Number(m.playLater)}:${Number(m.played)}`).join('|')
    if (signature === queueSignature) return
    queueSignature = signature
    invalidate()
  }
  const cleanup = () => {
    revision++
    attempted = false
    clearTimer()
    audioPreload.cancel()
  }
  onRelease(() => { cleanup(); unregistered.clear() })
  onPlayerCreated(() => {
    unregistered.register((subscriptions) => {
      subscriptions.add(cleanup)
      subscriptions.add(playerEvent.on('musicChanged', invalidate))
      subscriptions.add(playerEvent.on('playListChanged', queueChanged))
      subscriptions.add(playerEvent.on('play', schedule))
      subscriptions.add(playerEvent.on('playerWaiting', () => {
        revision++
        attempted = false
        clearTimer()
        audioPreload.suspend()
      }))
      subscriptions.add(playerEvent.on('stop', cleanup))
      subscriptions.add(settingEvent.on('updated', (keys) => {
        if (keys.some((key) => ['player.togglePlayMethod', 'player.shuffle', 'player.playQuality', 'network.proxyAllResources'].includes(key))) {
          invalidate()
        }
      }))
    })
  })
}
