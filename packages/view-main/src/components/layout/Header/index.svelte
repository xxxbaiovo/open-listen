<script lang="ts">
  import ControlBtns from './ControlBtns.svelte'
  import AppMenu from './AppMenu.svelte'
  import SearchInput from './SearchInput.svelte'
  import SvgIcon from '@/components/base/SvgIcon.svelte'
  import { windowDarg } from '@/shared/browser/widnow.svelte'
  import { link, location } from '@/plugins/routes'
  import { t } from '@/plugins/i18n'
  import { setShowPlayDetail } from '@/modules/playDetail/store/action'
  import { isShowPlayDetail } from '@/modules/playDetail/reactive.svelte'
  import { historyNavigation } from '@/shared/browser/navigation'
  let { libraryOpen, ontogglelibrary }: { libraryOpen: boolean; ontogglelibrary: () => void } = $props()
</script>

{#snippet contents()}
  <div class="menu-area">
    <div class="navigation-buttons no-drag">
      <AppMenu />
      <button
        class="history-btn"
        aria-label={$t('ui.navigate_back')}
        title={$t('ui.navigate_back')}
        disabled={!$historyNavigation.canBack && !$isShowPlayDetail}
        onclick={() => {
          if ($isShowPlayDetail) setShowPlayDetail(false)
          else window.history.back()
        }}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 4-8 8 8 8" /></svg>
      </button>
      <button
        class="history-btn"
        aria-label={$t('ui.navigate_forward')}
        title={$t('ui.navigate_forward')}
        disabled={!$historyNavigation.canForward}
        onclick={() => {
          setShowPlayDetail(false)
          window.history.forward()
        }}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 4 8 8-8 8" /></svg>
      </button>
    </div>
  </div>
  <button class="library-toggle no-drag" aria-label={$t('ui.library')} aria-expanded={libraryOpen} onclick={ontogglelibrary}>
    <SvgIcon name="menu" />
  </button>
  <div class="search-area no-drag">
    <a
      class="home-btn"
      class:active={$location === '/home' || $location === '/'}
      href="/home"
      aria-label={$t('ui.home')}
      onclick={() => setShowPlayDetail(false)}
      {@attach link()}><SvgIcon name="home" /></a
    >
    <SearchInput />
  </div>
  <div class="window-controls no-drag"><ControlBtns /></div>
{/snippet}

{#if import.meta.env.VITE_IS_DESKTOP}
  <header class="toolbar drag-no-any-modal" class:mac={import.meta.env.VITE_IS_MAC}>
    {@render contents()}
  </header>
{:else}
  <header class="toolbar" {@attach windowDarg}>{@render contents()}</header>
{/if}

<style lang="less">
  .toolbar {
    position: relative;
    z-index: 6;
    display: flex;
    flex: none;
    align-items: center;
    gap: 12px;
    height: var(--app-header-height);
    padding: 0 6px 0 12px;
  }
  .menu-area {
    flex: 1;
    min-width: 112px;
  }
  .navigation-buttons {
    display: flex;
    align-items: center;
    gap: 4px;
    width: max-content;
  }
  .history-btn {
    display: grid;
    flex: none;
    place-items: center;
    box-sizing: border-box;
    width: 32px;
    height: 32px;
    aspect-ratio: 1;
    padding: 6px;
    border: 0;
    border-radius: 50%;
    color: var(--color-font-label);
    background: transparent;
    cursor: pointer;
  }
  .history-btn svg {
    width: 20px;
    height: 20px;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.7;
  }
  .history-btn:hover:not(:disabled) {
    color: var(--color-font);
    background: var(--color-button-background-hover);
  }
  .history-btn:disabled { opacity: 0.3; cursor: default; }
  .search-area {
    display: flex;
    flex: 2;
    gap: 8px;
    align-items: center;
    min-width: 0;
    max-width: 560px;
  }
  .home-btn,
  .library-toggle {
    display: grid;
    flex: none;
    place-items: center;
    width: 44px;
    height: 44px;
    padding: 10px;
    color: var(--color-font-label);
    cursor: pointer;
    background: var(--color-surface-raised, var(--color-button-background));
    border: 0;
    border-radius: 50%;
  }
  .home-btn :global(svg),
  .library-toggle :global(svg) {
    width: 24px;
    height: 24px;
  }
  .home-btn:hover,
  .home-btn.active {
    color: var(--color-font);
    background: var(--color-button-background-hover);
  }
  .window-controls {
    position: relative;
    display: flex;
    flex: 1;
    align-self: center;
    justify-content: flex-end;
    min-width: 132px;
  }
  .library-toggle {
    display: none;
  }
  .mac {
    padding-left: 90px;
  }
  @media (max-width: 1000px) {
    .menu-area {
      flex: none;
    }
    .window-controls {
      flex: none;
    }
    .search-area {
      max-width: none;
    }
  }
  @media (max-width: 700px) {
    .toolbar {
      gap: 8px;
      padding: 0 10px;
    }
    .window-controls :global(.btn) {
      width: 28px;
    }
    .home-btn {
      display: none;
    }
    .library-toggle {
      display: grid;
    }
    .window-controls {
      min-width: 32px;
    }
  }
</style>
