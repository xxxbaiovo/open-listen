<script lang="ts">
  import Btn from '@/components/base/Btn.svelte'
  import SvgIcon from '@/components/base/SvgIcon.svelte'
  import { t, _locale } from '@/plugins/i18n'
  import type { ListInfo } from './type'
  import Image from '@/components/base/Image.svelte'
  import { LIST_IDS } from '@any-listen/common/constants'
  import { buildUrl } from '@any-listen/web'
  import { extractCoverPalette, neutralPalette } from '@/shared/coverPalette'
  import { settingState } from '@/modules/setting/store/state'
  import { appState } from '@/modules/app/store/state'
  let {
    source,
    disabled,
    listinfo,
    musiccount,
    durationSeconds = null,
    finding,
    saveable,
    onplay,
    onplayrandom,
    onsave,
    onfind,
    onduplicate,
    onsort,
  }: {
    source: AnyListen.Player.SourceType
    disabled: boolean
    listinfo: ListInfo
    musiccount: number
    durationSeconds?: number | null
    finding: boolean
    saveable?: boolean
    onplay: () => void
    onplayrandom: () => void
    onsave: () => void
    onfind: () => void
    onduplicate: () => void
    onsort: () => void
  } = $props()
  let moreOpen = $state(false)
  let moreDetails: HTMLDetailsElement | undefined = $state()
  let moreTrigger: HTMLElement | undefined = $state()
  let coverTint = $state(neutralPalette.background)
  $effect(() => {
    const controller = new AbortController()
    const pic = listinfo.pic
    coverTint = neutralPalette.background
    if (pic) {
      const url = buildUrl(pic, settingState.setting['network.proxyAllResources'], appState.proxyServerHost)
      void extractCoverPalette(url, controller.signal).then((palette) => {
        if (!controller.signal.aborted) coverTint = palette.background
      }).catch(() => {})
    }
    return () => controller.abort()
  })
  let duration = $derived.by(() => {
    if (durationSeconds === null) return ''
    const hours = Math.floor(durationSeconds / 3600)
    const minutes = Math.floor((durationSeconds % 3600) / 60)
    const seconds = durationSeconds % 60
    const format = (value: number, unit: string) =>
      new Intl.NumberFormat($_locale, { style: 'unit', unit, unitDisplay: 'long' }).format(value)
    return [
      hours ? format(hours, 'hour') : '',
      minutes ? format(minutes, 'minute') : '',
      seconds || !durationSeconds ? format(seconds, 'second') : '',
    ]
      .filter(Boolean)
      .join(' ')
  })
  const closeMore = () => {
    moreOpen = false
    moreTrigger?.focus()
  }
</script>

<svelte:window
  onclick={(event) => {
    if (moreOpen && !moreDetails?.contains(event.target as Node)) moreOpen = false
  }}
  onkeydown={(event) => {
    if (moreOpen && event.key === 'Escape' && moreDetails?.contains(event.target as Node)) {
      event.preventDefault()
      closeMore()
    }
  }}
/>

<div class="playlist-heading" class:liked={listinfo.id === LIST_IDS.LOVE} style:--playlist-tint={coverTint}>
  <div class="hero">
    <div class="cover"><Image src={listinfo.pic} icon={listinfo.picIcon} /></div>
    <div class="info">
      <p class="type">{$t('ui.playlist')}</p>
      <h1 title={listinfo.name}>{listinfo.name}</h1>
      {#if listinfo.desc}<p class="description" title={listinfo.desc}>{listinfo.desc}</p>{/if}
      <div class="metadata">
        <span>{musiccount} {$t('ui.tracks')}</span>{#if duration}<span>·</span><span class="duration">{duration}</span
          >{/if}{#if listinfo.playCount}<span>·</span><span><SvgIcon name="headphones" /> {listinfo.playCount}</span
          >{/if}{#if listinfo.createTime}<span>·</span><span>{listinfo.createTime}</span>{/if}
      </div>
    </div>
  </div>
  <div class="actions">
    <div class="primary-actions">
      <button class="play-all" disabled={!musiccount || disabled} onclick={onplay} aria-label={$t('play_all')}
        ><SvgIcon name="play" /></button
      >
      <button class="icon-button shuffle" disabled={!musiccount || disabled} onclick={onplayrandom} aria-label={$t('play_random')}
        ><SvgIcon name="list-random" /></button
      >
      {#if source !== 'local' && saveable}<Btn {disabled} outline icontext onclick={onsave}
          ><SvgIcon name="favorite_folder" />{$t('save_list')}</Btn
        >{/if}
      {#if source === 'local'}
      <details class="more" bind:this={moreDetails} bind:open={moreOpen}>
        <summary class="icon-button" bind:this={moreTrigger} aria-label={$t('ui.more_actions')}>
          <svg viewBox="0 0 24 24" aria-hidden="true"
            ><circle cx="4" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="20" cy="12" r="2" /></svg
          >
        </summary>
        <div class="more-panel">
          {#if source === 'local'}
            <button
              disabled={!musiccount || disabled}
              onclick={() => {
                closeMore()
                onduplicate()
              }}><SvgIcon name="duplicate" />{$t('duplicate_music')}</button
            >
          {/if}
        </div>
      </details>
      {/if}

    </div>
    <div class="secondary-actions">
      <button
        class="icon-button"
        class:engaged={finding}
        onclick={onfind}
        aria-pressed={finding}
        aria-label={finding ? $t('find_music_exit') : $t('find_music')}><SvgIcon name="search" /></button
      >
      {#if source === 'local'}
        <button class="sort-button" disabled={!musiccount || disabled} onclick={onsort} aria-label={$t('sort_music')}
          ><span>{$t('sort_music')}</span><SvgIcon name="sort" /></button
        >
      {/if}
    </div>
  </div>
</div>

<style lang="less">
  .playlist-heading {
    flex: none;
  }
  .hero {
    display: flex;
    align-items: flex-end;
    gap: 24px;
    padding: 24px;
    background: color-mix(in srgb, var(--playlist-tint) 38%, var(--color-content-background));
    color: var(--color-font);
  }
  .cover {
    flex: none;
    width: clamp(144px, 20cqw, 224px);
    max-width: 26vh;
    aspect-ratio: 1;
    overflow: hidden;
    border-radius: 4px;
    box-shadow: 0 4px 16px #0003, 0 12px 32px #0002;
    outline: 1px solid color-mix(in srgb, var(--color-font) 10%, transparent);
    outline-offset: -1px;
  }
  .liked .cover :global(.pic.empty-pic) {
    color: #fff;
    background: #6953b5;
  }
  .info {
    flex: 1;
    min-width: 0;
    padding-bottom: 2px;
  }
  .type {
    margin-bottom: 10px;
    font-size: 13px;
    font-weight: 500;
  }
  h1 {
    display: -webkit-box;
    overflow: hidden;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    font-size: clamp(36px, 7cqw, 88px);
    font-weight: 800;
    line-height: 1.06;
    letter-spacing: -0.035em;
    overflow-wrap: anywhere;
    text-wrap: balance;
  }
  .description {
    display: -webkit-box;
    overflow: hidden;
    margin-top: 12px;
    font-size: 13px;
    line-height: 1.5;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
  }
  .metadata {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 7px;
    margin-top: 16px;
    font-size: 13px;
    line-height: 1.6;
  }
  .duration {
    opacity: 0.8;
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 18px 24px;
    background: var(--color-content-background);
  }
  .primary-actions,
  .secondary-actions {
    display: flex;
    align-items: center;
    gap: 18px;
  }
  .secondary-actions {
    gap: 8px;
  }
  .play-all {
    display: grid;
    flex: none;
    place-items: center;
    width: 56px;
    height: 56px;
    padding: 15px 13px 15px 16px;
    color: var(--color-accent-on, #111);
    cursor: pointer;
    background: var(--color-primary);
    border: none;
    border-radius: 50%;
    transition:
      transform 150ms cubic-bezier(0.2, 0, 0, 1),
      filter 150ms;
  }
  .play-all :global(svg) {
    width: 100%;
    height: 100%;
  }
  .play-all:hover:not(:disabled) {
    transform: scale(1.04);
    filter: brightness(1.08);
  }
  .play-all:active:not(:disabled) {
    transform: scale(0.96);
  }
  .play-all:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  .icon-button,
  .sort-button,
  .mode-chip {
    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 40px;
    padding: 8px;
    color: var(--color-font-label);
    cursor: pointer;
    background: transparent;
    border: 0;
    border-radius: 50%;
    transition:
      color 150ms,
      background-color 150ms;
  }
  .icon-button {
    width: 40px;
  }
  .icon-button :global(svg) {
    width: 24px;
    height: 24px;
    fill: currentColor;
  }
  .shuffle :global(svg) {
    width: 28px;
    height: 28px;
  }
  .icon-button:hover,
  .sort-button:hover {
    color: var(--color-font);
  }
  .engaged {
    color: var(--color-primary-font-active);
    background: var(--color-primary-background-selected);
  }
  .sort-button {
    font-size: 12px;
    border-radius: 4px;
  }
  .sort-button :global(svg) {
    width: 20px;
    height: 20px;
  }
  button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  .more {
    position: relative;
  }
  summary {
    list-style: none;
  }
  summary::-webkit-details-marker {
    display: none;
  }
  .more[open] > summary {
    color: var(--color-font);
    background: var(--color-primary-background-hover);
  }
  .more-panel {
    position: absolute;
    z-index: 5;
    top: calc(100% + 8px);
    left: 0;
    width: max-content;
    min-width: 180px;
    padding: 5px;
    background: var(--color-surface-raised);
    border: 1px solid var(--color-border);
    border-radius: 7px;
    box-shadow: 0 8px 24px #0004;
  }
  .more-panel button {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    padding: 12px;
    color: var(--color-font);
    font-size: 13px;
    text-align: left;
    cursor: pointer;
    background: transparent;
    border: 0;
    border-radius: 4px;
  }
  .more-panel button:hover:not(:disabled) {
    background: var(--color-button-background-hover);
  }
  .mode-chip {
    font-size: 12px;
    color: var(--color-font);
    background: var(--color-primary-background-selected);
    border-radius: 24px;
    padding: 8px 12px;
  }
  button:focus-visible,
  summary:focus-visible {
    outline: 2px solid var(--color-font);
    outline-offset: 3px;
  }
  @container (max-width: 700px) {
    .hero {
      gap: 18px;
      padding: 20px 24px;
    }
    .cover {
      width: 145px;
    }
    h1 {
      font-size: clamp(30px, 6.7cqw, 44px);
      letter-spacing: -1px;
    }
    .actions {
      padding: 18px 24px;
    }
  }
  @container (max-width: 430px) {
    .hero {
      padding: 18px;
      gap: 14px;
    }
    .cover {
      width: 95px;
    }
    h1 {
      font-size: 25px;
    }
    .type {
      margin-bottom: 8px;
    }
    .metadata {
      margin-top: 12px;
      font-size: 11px;
    }
    .actions {
      padding: 16px;
      gap: 8px;
    }
    .primary-actions,
    .secondary-actions {
      gap: 4px;
    }
    .sort-button span {
      display: none;
    }
    .more-panel {
      left: auto;
      right: -36px;
    }
    .mode-chip {
      position: absolute;
      top: 8px;
      right: 16px;
    }
    .actions:has(.mode-chip) {
      position: relative;
      padding-top: 54px;
    }
    .play-all {
      width: 44px;
      height: 44px;
      padding: 12px;
    }
  }
  @media (max-height: 640px) {
    .hero {
      min-height: 0;
      padding: 16px 24px;
    }
    .cover {
      width: 128px;
    }
    h1 {
      font-size: clamp(28px, 5.5cqw, 44px);
    }
    .metadata {
      margin-top: 10px;
    }
    .actions {
      padding: 12px 24px;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .play-all,
    .icon-button,
    .sort-button,
    .mode-chip {
      transition: none;
    }
  }
</style>
