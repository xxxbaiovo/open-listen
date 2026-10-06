<script lang="ts">
  import Image from '@/components/base/Image.svelte'
  import SvgIcon from '@/components/base/SvgIcon.svelte'
  import { getListMusics } from '@/modules/musicLibrary/actions'
  import { useListCover } from '@/modules/musicLibrary/reactive.svelte'
  import { playList } from '@/modules/player/actions'
  import { LIST_PIC_ICON } from '@/shared/constants'
  import { LIST_IDS } from '@any-listen/common/constants'
  import { link } from '@/plugins/svelte-spa-router/navigator'
  import { t } from '@/plugins/i18n'
  import { musicDrag, canAddToPlaylist } from '@/shared/musicDrag.svelte'

  let { list, compact = false }: { list: AnyListen.List.MyListInfo; compact?: boolean } = $props()
  let starting = $state(false)

  // Cards are keyed by list ID; the hook subscribes to later cover changes.
  // svelte-ignore state_referenced_locally
  const cover = useListCover(list)

  const startPlayback = async () => {
    starting = true
    try {
      const tracks = await getListMusics(list.id)
      if (!tracks.length) return
      // Match the library's "play all": start at the first track and reset played history.
      await playList(list.id, tracks, 0, true)
    } finally {
      starting = false
    }
  }
  const playAll = async () => {
    if (!starting) return startPlayback()
  }
</script>

<div class="playlist-card" class:compact class:playable={list.meta.songCount > 0}
  role="group" aria-label={list.name}
  data-music-drop-id={canAddToPlaylist(list) ? list.id : undefined}
  class:drop-target={musicDrag.targetId === list.id && musicDrag.tracks.length > 0}
>
  <div class="artwork-area">
    <div class="artwork" class:liked={list.id === LIST_IDS.LOVE} class:recent={list.id === LIST_IDS.LAST_PLAYED}>
      <Image src={cover.val} icon={LIST_PIC_ICON[list.id as keyof typeof LIST_PIC_ICON]} />
    </div>
    {#if list.meta.songCount > 0}
      <button
        type="button"
        class="play-list"
        disabled={starting}
        aria-busy={starting}
        aria-label={`${$t('play_all')} · ${list.name}`}
        title={`${$t('play_all')} · ${list.name}`}
        onclick={playAll}
      >
        <SvgIcon name="play" />
      </button>
    {/if}
  </div>
  <div class="card-info">
    <h3>
      <a href={`/library?id=${encodeURIComponent(list.id)}`} {@attach link()} class="card-link" title={list.name}>
        {list.name}
      </a>
    </h3>
    <p>{list.meta.songCount} {$t('ui.tracks')}</p>
  </div>
</div>

<style lang="less">
  .playlist-card.drop-target { box-shadow: inset 0 0 0 2px #1ed760; background: var(--color-button-background-hover); }
  .playlist-card {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 14px;
    min-width: 0;
    padding: 12px;
    color: var(--color-font);
    border-radius: 8px;
    transition: background-color 150ms;
  }
  .playlist-card:hover,
  .playlist-card:focus-within {
    background: var(--color-primary-background-hover);
  }
  .card-link {
    color: inherit;
    text-decoration: none;
    outline: none;
  }
  .card-link::after {
    position: absolute;
    z-index: 1;
    inset: 0;
    content: '';
    border-radius: 8px;
  }
  .card-link:focus-visible {
    outline: none !important;
  }
  .card-link:focus-visible::after {
    outline: var(--focus-ring);
    outline-offset: -2px;
  }
  .artwork-area {
    position: relative;
    min-width: 0;
  }
  .artwork {
    width: 100%;
    aspect-ratio: 1;
    overflow: hidden;
    border-radius: 6px;
    box-shadow: 0 4px 16px #0002;
  }
  .artwork :global(.pic.empty-pic) {
    background: var(--color-surface-raised);
    color: var(--color-font-label);
  }
  .artwork.liked :global(.pic.empty-pic) {
    background: #6953b5;
    color: #fff;
  }
  .artwork.recent :global(.pic.empty-pic) {
    background: #35434f;
    color: #d2e2f0;
  }
  h3 {
    overflow: hidden;
    font-size: 15px;
    line-height: 1.5;
    font-weight: 550;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  p {
    margin-top: 4px;
    font-size: 12px;
    line-height: 1.5;
    color: var(--color-font-label);
  }
  .card-info {
    min-width: 0;
  }
  .play-list {
    position: absolute;
    z-index: 2;
    right: 10px;
    bottom: 10px;
    display: grid;
    width: 48px;
    height: 48px;
    padding: 14px 12px 14px 15px;
    place-items: center;
    color: var(--color-accent-on, #111);
    cursor: pointer;
    background: var(--color-primary);
    border: none;
    border-radius: 50%;
    box-shadow: 0 5px 16px #0004;
    opacity: 0;
    transform: translateY(6px);
    pointer-events: none;
    transition:
      opacity 150ms,
      transform 150ms,
      filter 150ms;
  }
  .play-list :global(svg) {
    width: 100%;
    height: 100%;
  }
  .playlist-card:hover .play-list,
  .playlist-card:focus-within .play-list {
    opacity: 1;
    transform: translateY(0);
    pointer-events: auto;
  }
  .play-list:hover:not(:disabled) {
    filter: brightness(1.08);
  }
  .play-list:focus-visible {
    outline: 2px solid var(--color-font);
    outline-offset: 3px;
  }
  .play-list:disabled {
    cursor: progress;
  }
  .compact {
    flex-direction: row;
    align-items: center;
    gap: 14px;
    padding: 0;
    overflow: hidden;
    background: var(--color-surface-raised, var(--color-button-background));
  }
  .compact .artwork-area {
    position: static;
    flex: none;
    width: 64px;
  }
  .compact .artwork {
    height: 64px;
    border-radius: 0;
  }
  .compact .card-info {
    padding-right: 16px;
  }
  .compact.playable .card-info {
    padding-right: 62px;
  }
  .compact .play-list {
    right: 10px;
    top: 10px;
    bottom: auto;
    width: 44px;
    height: 44px;
    padding: 12px 10px 12px 13px;
  }
  .compact p {
    margin-top: 2px;
  }
  @media (hover: none), (pointer: coarse) {
    .play-list {
      opacity: 1;
      transform: none;
      pointer-events: auto;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .playlist-card,
    .play-list {
      transition: none;
    }
    .play-list {
      transform: none;
    }
  }
</style>
