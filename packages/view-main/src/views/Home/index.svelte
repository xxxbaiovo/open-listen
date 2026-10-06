<script lang="ts">
  import { userListsAll } from '@/modules/musicLibrary/reactive.svelte'
  import { LIST_IDS } from '@any-listen/common/constants'
  import { t } from '@/plugins/i18n'
  import { showListEditModal } from '@/components/apis/listEditModal'
  import SvgIcon from '@/components/base/SvgIcon.svelte'
  import PlaylistCard from './PlaylistCard.svelte'
  import { musicDrag } from '@/shared/musicDrag.svelte'

  let filter = $state<'all' | 'local' | 'online'>('all')
  const lists = $derived($userListsAll.filter((item) =>
    item.id !== LIST_IDS.LAST_PLAYED && item.id !== LIST_IDS.DEFAULT &&
    (filter === 'all' || (filter === 'local'
      ? ['default', 'general', 'local'].includes(item.type)
      : ['online', 'remote'].includes(item.type)))
  ))
</script>

<div class="view-container home">
  <div class="home-content">
    <header class="heading">
      <h1>{$t('ui.your_playlists')}</h1>
      <button class="create-button" onclick={() => { void showListEditModal(undefined, false, 'general') }}>
        <SvgIcon name="plus" />{$t('ui.create')}
      </button>
    </header>
    <nav class="filters" aria-label={$t('ui.your_playlists')}>
      {#each ['all', 'local', 'online'] as item (item)}
        <button class:active={filter === item} aria-pressed={filter === item} onclick={() => (filter = item as typeof filter)}>
          {$t(item === 'all' ? 'ui.all' : item === 'local' ? 'ui.local' : 'ui.online')}
        </button>
      {/each}
    </nav>
    <section class="cards" aria-label={$t('ui.your_playlists')}>
      {#each lists as list (list.id)}<PlaylistCard {list} />{/each}
      {#if filter !== 'online'}
        <button
          class="create-card"
          data-music-drop-id="__new__"
          class:drop-target={musicDrag.targetId === '__new__' && musicDrag.tracks.length > 0}
          onclick={() => { void showListEditModal(undefined, false, 'general') }}
        >
          <span class="create-art"><SvgIcon name="plus" /></span>
          <strong>{$t('ui.new_playlist')}</strong>
          <span class="create-hint">{$t('ui.drop_to_create')}</span>
        </button>
      {:else if !lists.length}
        <p class="empty">{$t('ui.no_results')}</p>
      {/if}
    </section>
  </div>
</div>

<style lang="less">
  .home { overflow: auto; background: var(--color-content-background); }
  .home-content { max-width: 1600px; padding: 32px 28px 40px; margin: 0 auto; }
  .heading { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 24px; }
  h1 { font-size: 28px; font-weight: 700; line-height: 1.25; letter-spacing: -0.035em; }
  button { font: inherit; cursor: pointer; border: 0; }
  .create-button { display: inline-flex; align-items: center; gap: 7px; padding: 8px 14px; color: var(--color-font-label); background: transparent; border-radius: 20px; font-size: 13px; font-weight: 600; }
  .create-button :global(svg) { width: 17px; height: 17px; }
  .create-button:hover { color: var(--color-font); background: var(--color-button-background-hover); }
  .filters { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 24px; }
  .filters button { min-height: 32px; padding: 7px 15px; font-size: 13px; color: var(--color-font); background: var(--color-surface-raised); border-radius: 20px; }
  .filters button:hover { background: var(--color-button-background-hover); }
  .filters button.active { color: var(--color-play-button-on); background: var(--color-play-button); }
  .cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(144px, 1fr)); align-items: start; gap: 8px; margin: 0 -12px; }
  .cards > :global(*) { max-width: 208px; width: 100%; }
  .create-card { display: flex; flex-direction: column; gap: 5px; min-width: 0; padding: 12px; border-radius: 8px; color: var(--color-font); text-align: left; background: transparent; transition: background-color 120ms; }
  .create-card:hover { background: var(--color-button-background-hover); }
  .create-art { display: grid; place-items: center; width: 100%; aspect-ratio: 1; margin-bottom: 9px; color: var(--color-font-label); background: var(--color-surface-raised); border-radius: 6px; }
  .create-art :global(svg) { width: 36px; height: 36px; }
  .create-card strong { font-size: 15px; font-weight: 550; line-height: 1.5; }
  .create-hint { font-size: 12px; line-height: 1.5; color: var(--color-font-label); }
  .drop-target { box-shadow: inset 0 0 0 2px #1ed760; }
  .empty { padding: 24px 12px; color: var(--color-font-label); font-size: 14px; }
  @container (max-width: 650px) { .home-content { padding: 24px 20px; } }
  @container (max-width: 400px) {
    .home-content { padding: 20px 16px; }
    h1 { font-size: 24px; }
    .cards { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  }
</style>
