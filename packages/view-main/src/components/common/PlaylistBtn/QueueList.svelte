<script lang="ts">
  import VirtualizedList from '@/components/base/VirtualizedList.svelte'
  import { useListItemHeight } from '@/modules/app/reactive.svelte'
  import { playList, playMusicInfo } from '@/modules/player/reactive.svelte'
  import { play, playId } from '@/modules/player/actions'
  import { removePlayListMusic } from '@/modules/player/store/actions'
  import { showNotify } from '@/components/apis/notify'
  import { _locale } from '@/plugins/i18n'
  import ListItem from './ListItem.svelte'
  import { getQueueText } from './shared'

  const text = $derived(getQueueText($_locale))
  const rowHeight = useListItemHeight(4)
  const remaining = $derived($playList.filter((item) => item.itemId !== $playMusicInfo?.itemId))

  const remove = async (id: string) => {
    try {
      await removePlayListMusic([id])
    } catch (error) {
      showNotify(error instanceof Error ? error.message : String(error))
    }
  }
</script>

<div class="queue-content">
  {#if $playMusicInfo}
    <section class="current-track" aria-labelledby="queue-now-heading">
      <h3 id="queue-now-heading">{text.now}</h3>
      <ListItem info={$playMusicInfo} playing onplay={play} />
    </section>
  {/if}
  {#if remaining.length}
    <h3 class="next-heading">{text.next}</h3>
    <VirtualizedList list={remaining} keyname="itemId" itemheight={rowHeight.val} containerclass="queue-tracks" scrollbaroffset="0">
      {#snippet row(item)}
        <ListItem info={item} onplay={() => playId(item.itemId)} onremove={async () => remove(item.itemId)} />
      {/snippet}
    </VirtualizedList>
  {:else}
    <p class="empty">{$playMusicInfo ? text.emptyNext : text.emptyQueue}</p>
  {/if}
</div>

<style lang="less">
  .queue-content {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-height: 0;
    padding: 10px 12px 16px;
    overflow: hidden;
  }
  .current-track {
    flex: none;
    margin-bottom: 20px;
  }
  h3 {
    flex: none;
    margin: 12px 6px 10px;
    font-size: 15px;
    font-weight: 650;
    line-height: 1.5;
  }
  .next-heading {
    margin-top: 8px;
  }
  .empty {
    margin: 24px 6px;
    font-size: 13px;
    line-height: 1.6;
    color: var(--color-font-label);
  }
</style>
