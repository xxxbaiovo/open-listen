<script lang="ts">
  import SvgIcon from '@/components/base/SvgIcon.svelte'
  import { setShowPlayDetail } from '@/modules/playDetail/store/action'
  import { musicInfo } from '@/modules/player/reactive.svelte'
  import { t } from '@/plugins/i18n'
  import { windowDarg } from '@/shared/browser/widnow.svelte'

  let { focusLyrics, ontogglefocus }: { focusLyrics: boolean; ontogglefocus: () => void } = $props()
</script>

{#snippet content()}
  <div class="track-label" title={[$musicInfo.name, $musicInfo.singer].filter(Boolean).join(' · ')}>
    <strong>{$musicInfo.name || $t('ui.lyrics')}</strong>
    {#if $musicInfo.singer}<span>{$musicInfo.singer}</span>{/if}
  </div>
  <div class="control-btn no-drag">
    <button
      type="button"
      class="focus-toggle"
      aria-label={focusLyrics ? $t('ui.lyrics_cover') : $t('ui.lyrics_focus')}
      title={focusLyrics ? $t('ui.lyrics_cover') : $t('ui.lyrics_focus')}
      aria-pressed={focusLyrics}
      onclick={ontogglefocus}
    >
      <SvgIcon name={focusLyrics ? 'albums' : 'lyric'} />
      <span>{focusLyrics ? $t('ui.lyrics_cover') : $t('ui.lyrics_focus')}</span>
    </button>
    <button type="button" aria-label={$t('play_detail.hide_tip')} onclick={() => setShowPlayDetail(false)}>
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="m6 9 6 6 6-6"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </button>
  </div>
{/snippet}

{#if import.meta.env.VITE_IS_DESKTOP}
  <header class="header drag-no-modal">{@render content()}</header>
{:else}
  <header class="header" {@attach windowDarg}>{@render content()}</header>
{/if}

<style lang="less">
  .header {
    display: flex;
    flex: none;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    height: 64px;
    gap: 24px;
    padding: 0 26px;
  }
  .track-label {
    display: flex;
    align-items: baseline;
    gap: 12px;
    min-width: 0;
    color: #fff;
    font-size: 13px;
    line-height: 1.4;
  }
  .track-label strong,
  .track-label span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .track-label strong {
    min-width: 0;
    font-weight: 550;
  }
  .track-label span {
    max-width: 200px;
    color: #ffffffb3;
    font-size: 12px;
  }
  .control-btn {
    display: flex;
    flex: none;
    align-items: center;
    gap: 6px;
  }
  button {
    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    padding: 8px;
    color: #ffffffc7;
    cursor: pointer;
    background: transparent;
    border: none;
    border-radius: 50%;
    transition:
      color 150ms,
      background-color 150ms;
  }
  button:hover,
  button:focus-visible {
    color: #fff;
    background: #ffffff17;
  }
  button :global(svg) {
    width: 19px;
    height: 19px;
  }
  button.focus-toggle {
    gap: 7px;
    width: auto;
    padding: 8px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 500;
  }
  @container (max-width: 700px) {
    .header {
      height: 56px;
      gap: 10px;
      padding: 0 12px;
    }
    .track-label span,
    .focus-toggle span {
      display: none;
    }
    .control-btn {
      gap: 2px;
    }
    button.focus-toggle {
      width: 36px;
      padding: 8px;
    }
  }
</style>
