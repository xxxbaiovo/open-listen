<script lang="ts">
  import Image from '@/components/base/Image.svelte'
  import SvgIcon from '@/components/base/SvgIcon.svelte'
  import { t } from '@/plugins/i18n'
  import { scrollListTo } from '@/modules/app/store/action'
  import { getMusicPicDelay } from '@/modules/player/store/actions'

  let {
    info,
    playing = false,
    onplay,
    onremove
  }: {
    info: AnyListen.Player.PlayMusicInfo
    playing?: boolean
    onplay: () => void | Promise<void>
    onremove?: () => void | Promise<void>
  } = $props()

  let picUrl = $state<string | null>(null)
  let retry = $state(false)
  $effect(() => {
    const target = info
    let active = true
    const cancel = getMusicPicDelay(
      { musicInfo: target.musicInfo, listId: target.listId, source: target.source, isRefresh: retry },
      (url) => {
        if (active) picUrl = url
      }
    )
    return () => {
      active = false
      cancel?.()
    }
  })
</script>

<div class="queue-row" class:current={playing}>
  <button
    type="button"
    class="track"
    aria-label={`${$t('user_list_music_menu__play')} ${info.musicInfo.name}`}
    onclick={onplay}
  >
    <span class="cover">
      <Image
        src={picUrl}
        alt=""
        onerror={() => {
          picUrl = null
          retry = true
        }}
      />
      <span class="play-overlay" aria-hidden="true"><SvgIcon name="play" /></span>
    </span>
    <span class="track-copy">
      <span class="track-name" title={info.musicInfo.name}>{info.musicInfo.name}</span>
      <span class="artist" title={info.musicInfo.singer}
        >{info.musicInfo.singer || info.musicInfo.meta.albumName || '—'}</span
      >
    </span>
  </button>
  <div class="actions">
    <button
      type="button"
      aria-label={$t('user_list_music_menu__locate')}
      title={$t('user_list_music_menu__locate')}
      onclick={() => scrollListTo(info.listId, info.source, info.musicInfo)}><SvgIcon name="visit" /></button
    >
    {#if onremove}
      <button
        type="button"
        aria-label={$t('user_list_music_menu__remove')}
        title={$t('user_list_music_menu__remove')}
        onclick={onremove}
      >
        <SvgIcon name="close" />
      </button>
    {/if}
  </div>
</div>

<style lang="less">
  .queue-row {
    position: relative;
    display: flex;
    align-items: center;
    height: 64px;
    padding: 6px;
    border-radius: 6px;
  }
  .queue-row:hover,
  .queue-row:focus-within {
    background: var(--color-primary-background-hover);
  }
  button {
    color: inherit;
    cursor: pointer;
    background: transparent;
    border: 0;
  }
  button:focus-visible {
    outline: 2px solid var(--color-font);
    outline-offset: 2px;
  }
  .track {
    display: flex;
    flex: 1;
    align-items: center;
    gap: 12px;
    min-width: 0;
    height: 100%;
    padding: 0;
    text-align: left;
    border-radius: 4px;
  }
  .cover {
    position: relative;
    flex: none;
    width: 48px;
    height: 48px;
    overflow: hidden;
    border-radius: 4px;
  }
  .cover :global(.pic) {
    border-radius: 4px;
  }
  .play-overlay {
    position: absolute;
    inset: 0;
    display: grid;
    color: #fff;
    background: #0008;
    opacity: 0;
    place-items: center;
    transition: opacity 120ms ease-out;
  }
  .track:hover .play-overlay,
  .track:focus-visible .play-overlay {
    opacity: 1;
  }
  .track-copy {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }
  .track-name,
  .artist {
    overflow: hidden;
    line-height: 1.35;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .track-name {
    font-size: 14px;
    font-weight: 550;
  }
  .current .track-name {
    color: var(--color-primary);
  }
  .artist {
    font-size: 12px;
    color: var(--color-font-label);
  }
  .actions {
    display: flex;
    flex: none;
    gap: 2px;
    margin-left: 4px;
    opacity: 0;
  }
  .queue-row:hover .actions,
  .queue-row:focus-within .actions {
    opacity: 1;
  }
  .actions button {
    display: grid;
    width: 32px;
    height: 32px;
    color: var(--color-font-label);
    border-radius: 50%;
    place-items: center;
  }
  .actions button:hover {
    color: var(--color-font);
  }
  @media (hover: none) {
    .actions {
      opacity: 1;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .play-overlay {
      transition: none;
    }
  }
</style>
