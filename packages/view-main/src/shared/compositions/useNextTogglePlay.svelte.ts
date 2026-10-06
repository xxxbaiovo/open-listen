import { useSettingValue } from '@/modules/setting/reactive.svelte'
import { updateSetting } from '@/modules/setting/store/action'
import { settingEvent } from '@/modules/setting/store/event'
import { settingState } from '@/modules/setting/store/state'
import { useI18n } from '@/plugins/i18n.svelte'
import { createPlaybackOptionsController, getPlayModePresentation, readPlaybackOptions, repeatPlayMode } from '@/shared/playMode'

const readOptions = () => readPlaybackOptions(settingState.setting['player.togglePlayMethod'], settingState.setting['player.shuffle'])
const playModeController = createPlaybackOptionsController(
  readOptions,
  async (options) => updateSetting({ 'player.togglePlayMethod': repeatPlayMode(options.repeat), 'player.shuffle': options.shuffle })
)

settingEvent.on('updated', (keys) => {
  if (keys.includes('player.togglePlayMethod') || keys.includes('player.shuffle')) playModeController.observe(readOptions())
})

export const useNextTogglePlay = () => {
  const togglePlayMethod = useSettingValue('player.togglePlayMethod')
  const shuffle = useSettingValue('player.shuffle')
  const options = $derived(readPlaybackOptions(togglePlayMethod.val, shuffle.val))
  const i18n = useI18n()
  const presentation = $derived(getPlayModePresentation(togglePlayMethod.val))
  const nextTogglePlayName = $derived.by(() => {
    switch (togglePlayMethod.val) {
      case 'listLoop':
        return i18n.t('player__play_toggle_mode_list_loop')
      case 'random':
        return i18n.t('player__play_toggle_mode_random')
      case 'singleLoop':
        return i18n.t('player__play_toggle_mode_single_loop')
      case 'list':
        return i18n.t('player__play_toggle_mode_list')
      default:
        return i18n.t('player__play_toggle_mode_none')
    }
  })

  return {
    get shuffle() { return options.shuffle },
    get repeat() { return options.repeat },
    get mode() {
      return togglePlayMethod.val
    },
    get name() {
      return nextTogglePlayName
    },
    get icon() {
      return presentation.icon
    },
    get active() {
      return presentation.active
    },
    toggleMode: playModeController.select,
    nextMode: playModeController.next,
    toggleShuffle: playModeController.toggleShuffle,
    nextRepeat: playModeController.nextRepeat,
  }
}
