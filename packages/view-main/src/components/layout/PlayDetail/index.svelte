<script lang="ts">
  import { isShowPlayDetail } from '@/modules/playDetail/reactive.svelte'
  import { panelTransition } from '@/shared/panelTransition'
  import Header from './Header.svelte'
  import Main from './Main.svelte'
  import { useHidePlayDtail } from './shared/useHidePlayDtail'
  import { useSettingValue } from '@/modules/setting/reactive.svelte'
  import { buildUrl } from '@any-listen/web'
  import { extractCoverPalette, neutralPalette } from '@/shared/coverPalette'
  import { MediaQuery } from 'svelte/reactivity'
  import { settingState } from '@/modules/setting/store/state'
  import { musicInfo } from '@/modules/player/reactive.svelte'
  import { appState } from '@/modules/app/store/state'
  import { t } from '@/plugins/i18n'
  let palette = $state(neutralPalette)
  let focusLyrics = $state(true)
  const reducedMotion = new MediaQuery('(prefers-reduced-motion: reduce)')
  const animation = useSettingValue('common.isShowAnimation')
  const isDynamicBackground = useSettingValue('playDetail.isDynamicBackground')
  const coverUrl = $derived($musicInfo.pic)
  const hidePlayDtail = useHidePlayDtail()

  $effect(() => {
    const pic = coverUrl
    const enabled = isDynamicBackground.val
    const visible = $isShowPlayDetail
    const controller = new AbortController()
    palette = neutralPalette
    if (enabled && visible && pic) {
      const url = buildUrl(pic, settingState.setting['network.proxyAllResources'], appState.proxyServerHost)
      void extractCoverPalette(url, controller.signal)
        .catch(async () => {
          if (controller.signal.aborted) return neutralPalette
          const proxyUrl = buildUrl(pic, true, appState.proxyServerHost)
          // A restored local cover can arrive just before its server URL is registered.
          if (proxyUrl === url) {
            await new Promise((resolve) => {
              setTimeout(resolve, 350)
            })
          }
          if (controller.signal.aborted) return neutralPalette
          return extractCoverPalette(proxyUrl, controller.signal)
        })
        .then((colors) => {
          if (!controller.signal.aborted) palette = colors
        })
        .catch(() => {
          if (!controller.signal.aborted) palette = neutralPalette
        })
    }
    return () => controller.abort()
  })

</script>

{#if $isShowPlayDetail}
  <div
    transition:panelTransition={{ enabled: !reducedMotion.current && animation.val, duration: 320 }}
    inert={!$isShowPlayDetail}
    class="play-detail"
    style:--lyric-background={palette.background}
    style:--lyric-secondary={palette.secondary}
    role="region"
    aria-label={$t('ui.lyrics')}
    oncontextmenu={hidePlayDtail}
  >
    <div class="lyrics-workspace">
      <Header {focusLyrics} ontogglefocus={() => (focusLyrics = !focusLyrics)} />
      <Main introend={true} {focusLyrics} />
    </div>
  </div>
{/if}

<style lang="less">
  .lyrics-workspace {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-width: 0;
    min-height: 0;
  }
  .play-detail {
    --lyric-text-muted: #ffffff80;
    --lyric-text-active: #fff;
    --color-font: #fff;
    --color-font-label: #ffffffb3;
    --color-button-font: #fff;
    position: absolute;
    inset: 0;
    // Keep lyrics above the page, but below navigation and portaled popups.
    z-index: 4;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    contain: strict;
    container-type: inline-size;
    color: #fff;
    background: linear-gradient(
      150deg,
      color-mix(in srgb, var(--lyric-background) 72%, #1a2224),
      color-mix(in srgb, var(--lyric-background) 58%, var(--lyric-secondary))
    );
    border-radius: 10px;
  }
</style>
