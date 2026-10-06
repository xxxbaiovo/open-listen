<script lang="ts">
  import Nav from './Nav.svelte'
  import { t } from '@/plugins/i18n'
  import MyList from './MyList/index.svelte'
  let { onnavigate }: { onnavigate: () => void } = $props()
  const closeOnNavigation = (node: HTMLElement) => {
    const handle = (event: Event) => {
      if (event instanceof KeyboardEvent && !['Enter', ' '].includes(event.key)) return
      if (event.target instanceof Element && event.target.closest('a, .list-item [role="button"]')) onnavigate()
    }
    node.addEventListener('click', handle, true)
    node.addEventListener('keydown', handle, true)
    return () => {
      node.removeEventListener('click', handle, true)
      node.removeEventListener('keydown', handle, true)
    }
  }
</script>

<aside class="aside" aria-label={$t('ui.library')} {@attach closeOnNavigation}>
  <MyList /><Nav />
</aside>

<style lang="less">
  .aside {
    display: flex;
    flex: none;
    flex-direction: column;
    width: 22%;
    min-width: 230px;
    max-width: 300px;
    min-height: 0;
    padding: 10px 0;
    overflow: hidden;
    background: var(--color-content-background);
    border-radius: 8px;
  }
  .aside :global(.aside-nav) {
    gap: 2px;
    padding: 12px 12px 0;
    margin-top: 8px;
    border-top: 0;
  }
  .aside :global(.aside-nav .link) {
    min-height: 40px;
    color: var(--color-font-label);
    border-radius: 6px;
  }
  .aside :global(.aside-nav .link.active) {
    color: var(--color-font);
    background: var(--color-primary-background);
  }
  .aside :global(.aside-nav .nav-name) {
    font-size: 14px;
    font-weight: 500;
  }
</style>
