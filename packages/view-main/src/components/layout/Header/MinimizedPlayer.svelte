<script lang="ts">
  import { tick } from 'svelte'
  import { musicInfo, playing } from '@/modules/player/reactive.svelte'
  import { togglePlay } from '@/modules/player/actions'
  import { webWindow } from '@/shared/browser/minimized.svelte'
  import { t } from '@/plugins/i18n'
  import SvgIcon from '@/components/base/SvgIcon.svelte'

  const restore = async () => {
    webWindow.minimized = false
    await tick()
    document.querySelector<HTMLButtonElement>('.window-controls .min')?.focus()
  }
</script>

{#if import.meta.env.VITE_IS_WEB && webWindow.minimized}
  <div class="mini-player" role="region" aria-label={$t('ui.window_minimized')}>
    <button class="restore" onclick={restore} aria-label={$t('ui.restore_window')}>
      <SvgIcon name="music" />
      <span><strong>{$musicInfo.name || 'Any Listen'}</strong><small>{$t('ui.restore_window')}</small></span>
    </button>
    <button class="play" onclick={togglePlay} aria-label={$playing ? $t('player__pause') : $t('player__play')}>
      <SvgIcon name={$playing ? 'pause' : 'play'} />
    </button>
  </div>
{/if}

<style lang="less">
  .mini-player {
    position: fixed;
    z-index: 100;
    bottom: 16px;
    left: 16px;
    display: flex;
    align-items: center;
    gap: 12px;
    width: min(340px, calc(100vw - 32px));
    padding: 12px;
    border-radius: 14px;
    background: var(--color-content-background);
    color: var(--color-font);
    box-shadow: 0 8px 32px #0005;
  }
  button {
    border: 0;
    cursor: pointer;
    color: inherit;
    background: transparent;
  }
  .restore {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
    flex: 1;
    text-align: left;
  }
  .restore span {
    min-width: 0;
  }
  strong,
  small {
    display: block;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  strong {
    font-size: 14px;
    font-weight: 600;
  }
  small {
    margin-top: 5px;
    font-size: 12px;
    color: var(--color-font-label);
  }
  .restore :global(svg) {
    width: 28px;
    height: 28px;
    flex: none;
  }
  .play {
    display: grid;
    place-items: center;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: var(--color-button-background);
  }
  .play :global(svg) {
    width: 22px;
    height: 22px;
  }
</style>
