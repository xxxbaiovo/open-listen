<script lang="ts">
  import { useSettingValue } from '@/modules/setting/reactive.svelte'
  import { useLyric } from './useLyric.svelte'
  import type { ComponentExports } from 'svelte'
  import LyricMenu from './LyricMenu.svelte'
  import SvgIcon from '@/components/base/SvgIcon.svelte'
  import { t } from '@/plugins/i18n'

  let domLyric = $state<HTMLElement>()
  let domLyricText = $state<HTMLElement>()
  let domSkipLine = $state<HTMLElement>()
  let isMsDown = $state(false)
  let isStopScroll = $state(false)
  let timeStr = $state('--:--')
  const textAlign = useSettingValue('playDetail.style.align')
  const isZoomActiveLrc = useSettingValue('playDetail.isZoomActiveLrc')
  const fontSize = useSettingValue('playDetail.style.fontSize')
  const fontWeight = useSettingValue('playDetail.style.fontWeight')
  const fontScale = $derived((fontSize.val / 100 + 0.8) / 1.8)
  let lyricMenu = $state<ComponentExports<typeof LyricMenu>>()

  const {
    handleLyricMouseDown,
    handleLyricTouchStart,
    handleScroll,
    handleLyricClick,
    handleLyricKeyDown,
    handleResumeScroll,
    handleSkipPlay,
    handleSkipMouseEnter,
    handleSkipMouseLeave,
  } = useLyric({
    get domLyric() {
      return domLyric
    },
    get domLyricText() {
      return domLyricText
    },
    get domSkipLine() {
      return domSkipLine
    },
    onSetMsDown(value) {
      isMsDown = value
    },
    onSetStopScroll(value) {
      isStopScroll = value
    },
    onSetTimeStr(value) {
      timeStr = value
    },
  })
</script>

<!-- The focusable scroll region delegates activation to generated lyric buttons. -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
<div
  bind:this={domLyric}
  class="lyric"
  class:dragging={isMsDown}
  class:lrc-active-zoom={isZoomActiveLrc.val}
  class:font-weight={fontWeight.val}
  class:text-left={textAlign.val === 'left'}
  class:text-center={textAlign.val === 'center'}
  class:text-right={textAlign.val === 'right'}
  role="region"
  aria-label={$t('ui.lyrics_content')}
  tabindex="0"
  style:--lyric-font-scale={fontScale}
  style:text-align={textAlign.val}
  onscroll={handleScroll}
  onclick={handleLyricClick}
  onkeydown={handleLyricKeyDown}
  onmousedown={handleLyricMouseDown}
  ontouchstart={handleLyricTouchStart}
  oncontextmenu={(event) => {
    event.stopPropagation()
    lyricMenu?.show(event.pageX, event.pageY)
  }}
>
  <div class="pre lyric-space" aria-hidden="true"></div>
  <div class="lyric-text" bind:this={domLyricText}></div>
  <div class="lyric-space after" aria-hidden="true"></div>
</div>
<div class="seek-anchor" bind:this={domSkipLine} aria-hidden="true"></div>
{#if isStopScroll}
  <div class="browse-tools" role="group" aria-label={$t('ui.lyric_browsing')}>
    <button
      class="seek"
      aria-label={`${$t('ui.lyric_seek')} ${timeStr}`}
      onclick={handleSkipPlay}
      onmouseenter={handleSkipMouseEnter}
      onmouseleave={handleSkipMouseLeave}
    >
      <SvgIcon name="play" /><span>{timeStr}</span>
    </button>
    <span class="separator" aria-hidden="true"></span>
    <button class="resume" onclick={handleResumeScroll}>{$t('ui.lyric_resume')}</button>
  </div>
{/if}
<LyricMenu bind:this={lyricMenu} />

<style lang="less">
  .lyric {
    --play-detail-lrc-font-size: calc(clamp(28px, 3.4vw, 58px) * var(--lyric-font-scale, 1));
    position: relative;
    height: 100%;
    padding-inline: clamp(20px, 8cqw, 150px);
    overflow-x: hidden;
    overflow-y: auto;
    overscroll-behavior: contain;
    overflow-anchor: none;
    scroll-behavior: auto;
    scrollbar-width: thin;
    scrollbar-color: #ffffff38 transparent;
    scrollbar-gutter: stable;
    touch-action: pan-y;
    font-size: var(--play-detail-lrc-font-size);
    -webkit-mask-image: linear-gradient(transparent, #000 36px, #000 calc(100% - 36px), transparent);
    mask-image: linear-gradient(transparent, #000 36px, #000 calc(100% - 36px), transparent);
  }
  .lyric:focus-visible {
    outline-offset: -3px;
  }
  .lyric.dragging {
    cursor: grabbing;
    user-select: none;
  }
  .lyric-text {
    max-width: 1100px;
    margin-inline: auto;
  }
  .lyric-space {
    height: 38%;
    pointer-events: none;
  }
  .lyric-space.after {
    height: 52%;
  }
  .lyric :global(.line-content) {
    position: relative;
    padding: 0.32em 0.04em;
    margin: 0;
    font-weight: 500;
    line-height: 1.3;
    letter-spacing: -0.035em;
    color: var(--lyric-text-muted);
    overflow-wrap: anywhere;
    text-shadow: none;
    cursor: pointer;
    border-radius: 5px;
    transition:
      color 150ms,
      transform 150ms;
    transform-origin: center;
  }
  .font-weight :global(.line-content) {
    font-weight: 750;
  }
  .lyric :global(.font-lrc) {
    color: inherit;
  }
  .lyric :global(.line-content.active),
  .lyric :global(.line-content:hover),
  .lyric :global(.line-content:focus-visible) {
    color: var(--lyric-text-active);
  }
  .lyric :global(.line-content:focus-visible) {
    outline: 2px solid #ffffffaa;
    outline-offset: 2px;
  }
  .lyric :global(.line-content .extended) {
    margin-top: 0.3em;
    font-size: 0.55em;
    font-weight: 500;
    letter-spacing: -0.015em;
    line-height: 1.5;
  }
  .lrc-active-zoom :global(.line-content.active) {
    transform: scale(1.025);
  }
  .text-left :global(.line-content) {
    transform-origin: left center;
  }
  .text-right :global(.line-content) {
    transform-origin: right center;
  }
  .lyric :global(.font-mode > .line > .font-lrc > span) {
    background-color: var(--lyric-text-muted);
    background-image: linear-gradient(var(--lyric-text-active), var(--lyric-text-active));
    background-repeat: no-repeat;
    background-clip: text;
    -webkit-background-clip: text;
    background-size: 0 100%;
    -webkit-text-fill-color: transparent;
  }
  .lyric :global(.font-mode.played .font-lrc) {
    color: var(--lyric-text-active);
  }
  .seek-anchor {
    position: absolute;
    top: 46%;
    left: 50%;
    width: 1px;
    height: 1px;
    pointer-events: none;
    visibility: hidden;
  }
  .browse-tools {
    position: absolute;
    z-index: 2;
    right: 24px;
    bottom: 18px;
    display: flex;
    align-items: center;
    padding: 3px;
    color: #fff;
    background: #181a1ef2;
    border: 1px solid #ffffff1a;
    border-radius: 20px;
    box-shadow: 0 4px 16px #0003;
  }
  .browse-tools button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    min-height: 28px;
    padding: 5px 9px;
    font-size: 11px;
    font-weight: 600;
    line-height: 1.3;
    color: inherit;
    background: transparent;
    border: 0;
    border-radius: 16px;
    cursor: pointer;
    transition: background-color 150ms;
  }
  .browse-tools button:hover {
    background: #ffffff1a;
  }
  .browse-tools .seek {
    font-variant-numeric: tabular-nums;
  }
  .browse-tools :global(svg) {
    width: 13px;
    height: 13px;
  }
  .separator {
    width: 1px;
    height: 13px;
    background: #ffffff26;
  }
  :global(.focused) .lyric {
    padding-inline: clamp(20px, 16cqw, 280px);
  }
  @container (max-width: 1000px) {
    :global(.focused) .lyric {
      padding-inline: 10cqw;
    }
  }
  @container (max-width: 700px) {
    .lyric,
    :global(.focused) .lyric {
      padding-inline: clamp(12px, 5cqw, 24px);
    }
    .lyric {
      --play-detail-lrc-font-size: calc(clamp(22px, 5.4cqw, 36px) * var(--lyric-font-scale, 1));
    }
    .browse-tools {
      right: 16px;
      bottom: 10px;
    }
    .lyric :global(.line-content) {
      padding-block: 0.4em;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .lyric :global(.line-content) {
      transition: none;
      transform: none;
    }
  }
</style>
