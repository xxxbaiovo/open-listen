<script lang="ts">
  import Aside from './Aside/index.svelte'
  import WindowResize from './WindowResize.svelte'
  import Header from './Header/index.svelte'
  import Main from './Main.svelte'
  import PlayBar from './PlayBar/index.svelte'
  import PlayDetail from './PlayDetail/index.svelte'
  import { location, query } from '@/plugins/routes'
  import { webWindow } from '@/shared/browser/minimized.svelte'
  import MinimizedPlayer from './Header/MinimizedPlayer.svelte'
  import QueuePanel from './QueuePanel.svelte'
  import { queuePanelOpen } from '@/shared/queuePanel'
  import { isShowPlayDetail } from '@/modules/playDetail/reactive.svelte'
  import { useSettingValue } from '@/modules/setting/reactive.svelte'
  import { MediaQuery } from 'svelte/reactivity'
  const animation = useSettingValue('common.isShowAnimation')
  const reducedMotion = new MediaQuery('(prefers-reduced-motion: reduce)')
  let libraryOpen = $state(false)
  $effect(() => {
    if ($location && $query) libraryOpen = false
  })
</script>

<div class="app-shell" class:minimized={webWindow.minimized} class:show-fullscreen-modal={$isShowPlayDetail}
  inert={webWindow.minimized} style:--panel-duration={animation.val && !reducedMotion.current ? '320ms' : '0ms'}>
  <Header {libraryOpen} ontogglelibrary={() => (libraryOpen = !libraryOpen)} />
  <div id="app-main" class:library-open={libraryOpen}>
    <div class="content-stage">
      <div class="browse-workspace" inert={$isShowPlayDetail}>
        <Aside onnavigate={() => (libraryOpen = false)} />
        <div id="app-right"><Main /></div>
      </div>
      <PlayDetail />
    </div>
    <div class="queue-slot" class:open={$queuePanelOpen} inert={!$queuePanelOpen} aria-hidden={!$queuePanelOpen}>
      <QueuePanel />
    </div>
  </div>
  <PlayBar />
  {#if import.meta.env.VITE_IS_DESKTOP && !import.meta.env.VITE_IS_MAC}<WindowResize />{/if}
</div>
<MinimizedPlayer />

<style lang="less">
  .app-shell {
    --app-header-height: 64px;
    --queue-panel-width: min(350px, 40vw);
    position: relative;
    display: flex;
    flex: 1;
    flex-direction: column;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
  }
  .app-shell.minimized {
    visibility: hidden;
    pointer-events: none;
  }
  #app-main {
    position: relative;
    display: flex;
    flex: 1;
    min-width: 0;
    min-height: 0;
    padding: 0 8px;
  }
  .content-stage {
    position: relative;
    flex: 1;
    min-width: 0;
    overflow: hidden;
    border-radius: 10px;
  }
  .browse-workspace {
    display: flex;
    height: 100%;
    gap: 8px;
    min-width: 0;
  }
  .queue-slot {
    position: relative;
    flex: none;
    width: 0;
    min-width: 0;
    overflow: hidden;
    // The fixed-width panel moves with this slot's left edge as content makes room.
    transition: width var(--panel-duration) cubic-bezier(0.2, 0, 0, 1);
  }
  .queue-slot.open {
    width: calc(var(--queue-panel-width) + 8px);
  }
  #app-right {
    position: relative;
    display: flex;
    flex: 1;
    flex-direction: column;
    min-width: 0;
    overflow: hidden;
    background: var(--color-content-background);
    border-radius: 10px;
  }
  @media (max-width: 700px) {
    .app-shell {
      --app-header-height: 64px;
      --queue-panel-width: 46vw;
    }
    #app-main :global(.aside) {
      display: none;
    }
    #app-main.library-open :global(.aside) {
      display: flex;
      width: 100%;
      max-width: none;
    }
    #app-main.library-open #app-right {
      display: none;
    }
  }
</style>
