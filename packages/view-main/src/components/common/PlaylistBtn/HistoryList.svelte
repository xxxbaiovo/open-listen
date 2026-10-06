<script lang="ts">
  import { onMount } from 'svelte'
  import { LIST_IDS } from '@any-listen/common/constants'
  import { createPlayMusicInfoList } from '@any-listen/common/tools'
  import VirtualizedList from '@/components/base/VirtualizedList.svelte'
  import { useListItemHeight } from '@/modules/app/reactive.svelte'
  import { getListMusics, removeListMusics } from '@/modules/musicLibrary/actions'
  import { musicLibraryEvent } from '@/modules/musicLibrary/store/event'
  import { playList } from '@/modules/player/actions'
  import { playMusicInfo } from '@/modules/player/reactive.svelte'
  import { showNotify } from '@/components/apis/notify'
  import { _locale, t } from '@/plugins/i18n'
  import ListItem from './ListItem.svelte'
  import { getQueueText } from './shared'

  const text = $derived(getQueueText($_locale))
  const rowHeight = useListItemHeight(4)
  let tracks = $state.raw<AnyListen.Music.MusicInfo[]>([])
  let loading = $state(true)
  let failed = $state(false)
  let disposed = false
  let request = 0
  const items = $derived(createPlayMusicInfoList({ musicInfos: tracks, listId: LIST_IDS.LAST_PLAYED, source: 'local', playLater: false }))

  const load = async () => {
    const currentRequest = ++request
    failed = false
    try {
      const list = await getListMusics(LIST_IDS.LAST_PLAYED)
      if (!disposed && currentRequest === request) tracks = [...list]
    } catch {
      if (!disposed && currentRequest === request) failed = true
    } finally {
      if (!disposed && currentRequest === request) loading = false
    }
  }

  const remove = async (id: string) => {
    try {
      await removeListMusics(LIST_IDS.LAST_PLAYED, [id])
    } catch (error) {
      showNotify(error instanceof Error ? error.message : String(error))
    }
  }

  onMount(() => {
    void load()
    const stopChanged = musicLibraryEvent.on('listMusicChanged', (ids) => {
      if (ids.includes(LIST_IDS.LAST_PLAYED)) void load()
    })
    const stopUpdated = musicLibraryEvent.on('listMusicUpdated', (updates) => {
      if (updates.has(LIST_IDS.LAST_PLAYED)) void load()
    })
    return () => {
      disposed = true
      stopChanged()
      stopUpdated()
    }
  })
</script>

<div class="history-content" aria-busy={loading}>
  {#if loading}
    <p class="message">{$t('loading')}</p>
  {:else if failed}
    <div class="message"><p>{text.failed}</p><button type="button" onclick={load}>{text.retry}</button></div>
  {:else if items.length}
    <VirtualizedList list={items} keyname="itemId" itemheight={rowHeight.val} scrollbaroffset="0">
      {#snippet row(item, index)}
        <ListItem
          info={item}
          playing={item.musicInfo.id === $playMusicInfo?.musicInfo.id}
          onplay={async () => playList(LIST_IDS.LAST_PLAYED, tracks, index)}
          onremove={async () => remove(item.musicInfo.id)}
        />
      {/snippet}
    </VirtualizedList>
  {:else}
    <p class="message">{text.emptyHistory}</p>
  {/if}
</div>

<style lang="less">
  .history-content {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-height: 0;
    padding: 20px 12px 16px;
    overflow: hidden;
  }
  .message {
    margin: 14px 6px;
    font-size: 13px;
    line-height: 1.6;
    color: var(--color-font-label);
  }
  button {
    margin-top: 12px;
    padding: 6px 0;
    font: inherit;
    font-weight: 600;
    color: var(--color-font);
    cursor: pointer;
    background: transparent;
    border: 0;
  }
</style>
