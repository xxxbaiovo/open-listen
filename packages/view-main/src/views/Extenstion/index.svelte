<script lang="ts">
  import Header from './Header.svelte'
  import { query } from '@/plugins/routes'
  import { viewTypes } from './shared'
  import InstalledList from './InstalledList.svelte'
  import OnlineList from './OnlineList.svelte'

  let activeView = $derived<(typeof viewTypes)[number]>(viewTypes.find((t) => t == $query.view) ?? 'installed')
</script>

<div class="extensions-manager">
  <Header activeview={activeView} />
  {#if activeView == 'online'}
    <OnlineList />
  {:else}
    <InstalledList type={activeView} />
  {/if}
</div>

<style lang="less">
  .extensions-manager {
    display: flex;
    flex: 1;
    flex-flow: column nowrap;
    min-height: 0;
    padding: 14px 16px 16px;
  }
  @container (max-width: 620px) {
    .extensions-manager {
      padding: 10px 2px 12px;
    }
  }
</style>
