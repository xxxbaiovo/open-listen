import { onRelease } from '@/modules/app/shared'
import { isValidLyric } from '@any-listen/common/lyric'
import { playerEvent } from '@/modules/player/store/event'
import { playerState } from '@/modules/player/store/state'
import { settingEvent } from '@/modules/setting/store/event'
import { settingState } from '@/modules/setting/store/state'
import { getCurrentTime as getPlayerCurrentTime } from '@/plugins/player'
import { createUnsubscriptionSet } from '@/shared'

// import * as desktopLyric from './desktopLyric'
import * as lyric from './lyric'
import { initMacStatusBarLyric } from './macStatusBarLyric'
import { setOffset } from './store/action'
import { lyricState } from './store/state'
import { initTitleLyric } from './titleLyric'

const getCurrentTime = () => {
  return getPlayerCurrentTime() * 1000
}

const play = () => {
  if (!lyricState.lines.length && isValidLyric(playerState.musicInfo.lrc)) restoreCurrentLyric()
  // if (!musicInfo.lrc) return
  const currentTime = getCurrentTime()
  lyric.play(currentTime)
}
const pause = () => {
  lyric.pause()
}

const stop = () => {
  lyric.stop()
}

const setLyricOffset = (offset: number) => {
  lyric.setOffset(offset)
  setOffset(offset)
  playerEvent.lyricOffsetUpdated(offset)
  // console.log('setLyricOffset', offset)
  if (playerState.playerPlaying) setTimeout(play)
  else lyric.syncPausedTime(playerState.progress.nowPlayTime * 1000)
}

const setPlaybackRate = (rate: number) => {
  lyric.setPlaybackRate(rate)

  if (playerState.playerPlaying) setTimeout(play)
  else lyric.syncPausedTime(playerState.progress.nowPlayTime * 1000)
}

export const restoreCurrentLyric = () => {
  if (!playerState.musicInfo.id) return
  if (isValidLyric(playerState.musicInfo.lrc)) {
    const extendedLyrics = []
    if (settingState.setting['player.isShowLyricRoma'] && playerState.musicInfo.rlrc) {
      extendedLyrics.push(playerState.musicInfo.rlrc)
    }
    if (settingState.setting['player.isShowLyricTranslation'] && playerState.musicInfo.tlrc) {
      extendedLyrics.push(playerState.musicInfo.tlrc)
    }
    if (settingState.setting['player.isSwapLyricTranslationAndRoma']) {
      extendedLyrics.reverse()
    }
    lyric.setLyric(
      settingState.setting['player.isPlayAwlrc'] && isValidLyric(playerState.musicInfo.awlrc)
        ? playerState.musicInfo.awlrc
        : playerState.musicInfo.lrc,
      extendedLyrics
    )
  }

  if (playerState.playerPlaying) lyric.play(getCurrentTime())
  else lyric.syncPausedTime(playerState.progress.nowPlayTime * 1000)
}
const watchSettings = [
  'player.isShowLyricTranslation',
  'player.isShowLyricRoma',
  'player.isSwapLyricTranslationAndRoma',
  'player.isPlayAwlrc',
] satisfies Array<keyof AnyListen.AppSetting>

const unregistered = createUnsubscriptionSet()
export const initLyric = () => {
  onRelease(() => {
    stop()
    unregistered.clear()
  })
  settingEvent.on('inited', () => {
    unregistered.register((subscriptions) => {
      subscriptions.add(lyric.initLyric())
      if (import.meta.env.VITE_IS_MAC) subscriptions.add(initMacStatusBarLyric()) // 需在 initTitleLyric 之前初始化
      subscriptions.add(initTitleLyric())
      subscriptions.add(playerEvent.on('lyricUpdated', restoreCurrentLyric))
      subscriptions.add(playerEvent.on('setLyricOffset', setLyricOffset))
      subscriptions.add(playerEvent.on('setPlaybackRate', setPlaybackRate))
      subscriptions.add(
        settingEvent.on('updated', (keys) => {
          if (watchSettings.some((k) => keys.includes(k))) restoreCurrentLyric()
        })
      )
      subscriptions.add(playerEvent.on('musicChanged', stop))
      subscriptions.add(playerEvent.on('play', play))
      subscriptions.add(playerEvent.on('pause', pause))
      // Stopping playback keeps the current song's lyrics available; changing songs clears them.
      subscriptions.add(playerEvent.on('stop', pause))
      subscriptions.add(playerEvent.on('error', pause))
    })
  })
}
