<script lang="ts">
  import Header from '@/components/common/PlaylistBtn/Header.svelte'
  import QueueList from '@/components/common/PlaylistBtn/QueueList.svelte'
  import HistoryList from '@/components/common/PlaylistBtn/HistoryList.svelte'
  import type { TabType } from '@/components/common/PlaylistBtn/shared'
  import { closeQueuePanel, queuePanelOpen } from '@/shared/queuePanel'
  import { t } from '@/plugins/i18n'
  let active = $state<TabType>('queue')
  let panel = $state<HTMLElement>()
  let initialized = $state(false)

  $effect(() => {
    if (!$queuePanelOpen) return
    initialized = true
    panel?.focus({ preventScroll: true })
  })
</script>

<svelte:window
  onkeydown={(event) => {
    if (!$queuePanelOpen || event.key !== 'Escape' || event.defaultPrevented) return
    event.preventDefault()
    closeQueuePanel()
  }}
/>

<aside id="queue-panel" class="queue-panel" aria-label={$t('player__list')} tabindex="-1" bind:this={panel}
  inert={!$queuePanelOpen}
>
  <Header bind:active />
  {#if initialized}
    {#if active === 'queue'}<QueueList />{:else}<HistoryList />{/if}
  {/if}
</aside>

<style lang="less">
  .queue-panel {
    position: absolute;
    top: 0;
    left: 8px;
    bottom: 0;
    width: var(--queue-panel-width);
    container-type: inline-size;
    display: flex;
    flex-direction: column;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
    color: var(--color-font);
    background: var(--color-content-background);
    border-radius: 10px;
    outline: none;
  }
</style>
