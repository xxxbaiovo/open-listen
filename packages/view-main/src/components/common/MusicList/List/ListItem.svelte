<script lang="ts">
  import Image from '@/components/base/Image.svelte'
  import type { MouseEventHandler } from 'svelte/elements'
  import { buildSourceLabel } from '@any-listen/common/tools'
  import { onMount, tick } from 'svelte'
  import { getMusicPicDelay } from '@/modules/player/store/actions'
  import SvgIcon from '@/components/base/SvgIcon.svelte'
  import { t } from '@/plugins/i18n'
  import { useSettingValue } from '@/modules/setting/reactive.svelte'
  import MusicHeartBtn from '@/components/common/MusicHeartBtn.svelte'
  import { LIST_IDS } from '@any-listen/common/constants'

  let {
    musicinfo,
    listid,
    index,
    source,
    picStyle,
    selected,
    selectionstart,
    selectionend,
    playing,
    active,
    oncontextmenu,
    onclick,
    onplay,
    onpointerdown,
  }: {
    musicinfo: AnyListen.Music.MusicInfo
    listid: string
    source: AnyListen.Player.SourceType
    index: number
    picStyle: string
    playing?: boolean
    selected?: boolean
    active?: boolean
    selectionstart?: boolean
    selectionend?: boolean
    oncontextmenu?: MouseEventHandler<HTMLDivElement>
    onclick: (isKey: boolean, event: MouseEvent | KeyboardEvent) => void
    onplay?: () => void
    onpointerdown?: (event: MouseEvent) => void
  } = $props()

  let sourceText = $derived(buildSourceLabel(musicinfo).join(' · '))
  let rowLabel = $derived([musicinfo.name, musicinfo.singer, musicinfo.meta.albumName, sourceText].filter(Boolean).join(' · '))
  let picUrl = $state<null | string>(null)
  let isShowActionBtn = useSettingValue('list.isShowActionBtn')

  const handleClick = (event: KeyboardEvent | MouseEvent) => {
    if ('key' in event) {
      // Nested play and favorite buttons keep their native keyboard behavior.
      if (event.target !== event.currentTarget) return
      if (event.repeat || (event.key != 'Enter' && event.key != ' ')) return
      event.preventDefault()
      onclick(true, event)
    } else {
      (event.currentTarget as HTMLElement).focus({ preventScroll: true })
      onclick(false, event)
    }
  }

  let cancelLoadPic: (() => void) | undefined = undefined
  let retryedLoadPic = false
  const loadPic = () => {
    cancelLoadPic?.()
    cancelLoadPic = getMusicPicDelay({ musicInfo: musicinfo, listId: listid, source, isRefresh: retryedLoadPic }, (url) => {
      cancelLoadPic = undefined
      void tick().then(() => {
        picUrl = url
      })
    })
  }

  onMount(() => {
    retryedLoadPic = false
    loadPic()
    return () => {
      cancelLoadPic?.()
    }
  })
</script>

<div
  class="container"
  data-music-draggable={!!onpointerdown}
  {onpointerdown}
  onmousedown={onpointerdown}
  class:selected
  class:active
  class:selectionstart
  class:selectionend
  class:playing
  class:has-play={Boolean(onplay) && isShowActionBtn.val}
  role="button"
  aria-label={rowLabel}
  title={rowLabel}
  tabindex="0"
  onkeydown={handleClick}
  onclick={handleClick}
  {oncontextmenu}
>
  <div class="row-number">
    <span class="row-index" aria-hidden="true">{index + 1}</span>
    {#if onplay && isShowActionBtn.val}
      <button
        type="button"
        class="row-play"
        aria-label={`${$t('player__play')} · ${musicinfo.name}`}
        title={$t('player__play')}
        onclick={(event) => {
          event.stopPropagation()
          if (event.shiftKey || event.ctrlKey || event.metaKey) onclick(false, event)
          else onplay?.()
        }}
        ondblclick={(event) => event.stopPropagation()}
      >
        <SvgIcon name="play" />
      </button>
    {/if}
  </div>
  <div class="title-cell">
    <div class="cover" style={picStyle}>
      <Image
        src={picUrl}
        onerror={() => {
          picUrl = null
          if (retryedLoadPic) return
          retryedLoadPic = true
          loadPic()
        }}
      />
    </div>
    <div class="track-text" title={rowLabel}>
      <span class="select name">{musicinfo.name}</span>
      <span class="select singer">{musicinfo.singer || '—'}</span>
    </div>
    {#if isShowActionBtn.val && listid !== LIST_IDS.LOVE}
      <div class="track-actions">
        <MusicHeartBtn {musicinfo} min />
      </div>
    {/if}
  </div>
  <div class="album" title={musicinfo.meta.albumName}>
    <span class="select">{musicinfo.meta.albumName || '—'}</span>
  </div>
  <div class="time">
    <span class="no-select">{musicinfo.interval || '--:--'}</span>
  </div>
</div>

<style lang="less">
  .container {
    position: relative;
    display: grid;
    grid-template-columns: 32px minmax(0, 1fr) minmax(100px, 26%) 64px;
    gap: 14px;
    align-items: center;
    height: 100%;
    min-width: 0;
    padding: 6px 12px;
    font-size: 14px;
    background-color: transparent;
    border-radius: 5px;
    outline: none;
    transition: background-color 150ms;

    &:not(.active, .selected):hover,
    &:not(.active, .selected):focus-within {
      background-color: var(--color-primary-background-hover);
    }
    &.selected {
      background-color: color-mix(in srgb, var(--color-font) 30%, var(--color-content-background));
      border-radius: 0;
      transition: none;
    }
    &.selectionstart { border-top-left-radius: 4px; border-top-right-radius: 4px; }
    &.selectionend { border-bottom-left-radius: 4px; border-bottom-right-radius: 4px; }
    &.active:not(.selected) {
      background-color: var(--color-primary-background-active);
    }
    &:focus-visible {
      box-shadow: inset 0 0 0 1px var(--color-font-label);
    }
  }
  .row-number {
    position: relative;
    display: grid;
    place-items: center;
    height: 32px;
    color: var(--color-font-label);
    font-size: 13px;
    font-variant-numeric: tabular-nums;
  }
  .row-index {
    transition: opacity 120ms;
  }
  .row-play {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    width: 100%;
    height: 100%;
    padding: 8px 7px 8px 9px;
    color: var(--color-font);
    cursor: pointer;
    background: transparent;
    border: none;
    border-radius: 4px;
    opacity: 0;
    pointer-events: none;
    transition:
      opacity 120ms,
      background-color 120ms;
  }
  .row-play :global(svg) {
    width: 16px;
    height: 16px;
  }
  .has-play:hover .row-index,
  .has-play:focus-within .row-index {
    opacity: 0;
  }
  .container:hover .row-play,
  .container:focus-within .row-play {
    opacity: 1;
    pointer-events: auto;
  }
  .row-play:focus-visible {
    outline: 2px solid var(--color-font);
    outline-offset: 1px;
  }
  .row-play:hover {
    background: var(--color-primary-background-hover);
  }
  .title-cell {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
  }
  .cover {
    flex: none;
    overflow: hidden;
    border-radius: 4px;
  }
  .track-text {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 3px;
    min-width: 0;
    line-height: 1.35;
  }
  .name,
  .singer,
  .album {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .name {
    font-size: 14px;
    font-weight: 450;
    color: var(--color-font);
  }
  .singer {
    font-size: 13px;
    font-weight: 400;
    color: var(--color-font-label);
  }
  .track-actions {
    display: flex;
    flex: none;
    align-items: center;
    color: var(--color-font-label);
    opacity: 0;
    transition: opacity 120ms;
  }
  .container:hover .track-actions,
  .container:focus-within .track-actions,
  .track-actions:has(:global([aria-pressed='true'])) { opacity: 1; }
  .track-actions :global(.btn) {
    padding: 5px;
  }
  .album,
  .time {
    min-width: 0;
    font-size: 13px;
    color: var(--color-font-label);
  }
  .time {
    text-align: right;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }
  .playing .row-number,
  .playing .name {
    color: var(--color-primary);
  }
  @container (max-width: 600px) {
    .container {
      grid-template-columns: 28px minmax(0, 1fr) 48px;
      gap: 10px;
      padding-right: 8px;
      padding-left: 8px;
    }
    .album {
      display: none;
    }
    .title-cell {
      gap: 8px;
    }
    .track-actions :global(.btn) {
      padding: 3px;
    }
  }
  @media (hover: none), (pointer: coarse) {
    .track-actions { opacity: 1; }
    .has-play .row-index {
      opacity: 0;
    }
    .row-play {
      opacity: 1;
      pointer-events: auto;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .container,
    .row-index,
    .row-play {
      transition: none;
    }
  }
</style>
