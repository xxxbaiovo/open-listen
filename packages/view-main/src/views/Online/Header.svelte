<script lang="ts">
  import Tab from '@/components/base/Tab.svelte'
  import { t } from '@/plugins/i18n'
  import { tabIcons, viewResourceMap, viewTypes, urlParamKeyMap } from './shared.svelte'
  import { resourceList } from '@/modules/extension/reactive.svelte'
  import { pushRoute } from '@/modules/resource/actions'

  let { activeview }: { activeview: (typeof viewTypes)[number] } = $props()
  const typeList = $derived.by(() => {
    const res = Object.keys($resourceList.resources)
    return viewTypes
      .filter((view) => {
        return viewResourceMap[view].some((r) => res.includes(r))
      })
      .map((view) => {
        return { id: view, icon: tabIcons[view], label: $t(`online__type_${view}`) }
      })
  })
</script>

<header class="header">
  <div class="primary-nav">
    <Tab
      list={typeList}
      itemkey="id"
      itemlabel="label"
      itemicon="icon"
      value={activeview}
      min
      onchange={(item) => {
        pushRoute('/online', { [urlParamKeyMap.type]: item.id })
      }}
    />
  </div>
  <div id="online-header-right"></div>
</header>

<style lang="less">
  .header {
    display: flex;
    flex: none;
    flex-flow: row nowrap;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 14px 16px 10px;
    // padding: 8px 0;
    // background-color: var(--color-primary-light-400-alpha-800);
    // border-radius: @radius-border;

    // h2 {
    //   font-size: 18px;
    //   padding: 0 15px;
    // }
  }
  .primary-nav {
    min-width: 0;
    overflow-x: auto;
    scrollbar-width: none;
  }
  .primary-nav :global(.list) {
    gap: 4px;
  }
  .primary-nav :global(.list-item) {
    flex: none;
    min-height: 34px;
    padding: 0 12px;
    color: var(--color-font-label);
    border-radius: 18px;
    font-size: 13px;
    font-weight: 550;
    transition:
      color 150ms,
      background-color 150ms;
  }
  .primary-nav :global(.list-item:hover) {
    color: var(--color-font);
    background: var(--color-button-background-hover);
  }
  .primary-nav :global(.list-item.active) {
    color: var(--color-content-background);
    background: var(--color-font);
  }
  .primary-nav :global(.label) {
    gap: 6px;
    padding: 7px 0;
    white-space: nowrap;
  }
  .primary-nav :global(.label svg) {
    width: 15px;
    height: 15px;
  }
  .primary-nav :global(.label::after),
  #online-header-right :global(.label::after) {
    display: none;
  }
  #online-header-right {
    flex: none;
    max-width: 100%;
    overflow-x: auto;
    scrollbar-width: none;
  }
  #online-header-right:empty {
    display: none;
  }
  #online-header-right :global(.list) {
    gap: 4px;
  }
  #online-header-right :global(.list-item) {
    flex: none;
    min-width: 50px;
    min-height: 30px;
    padding: 0 10px;
    color: var(--color-font-label);
    border-radius: 16px;
    font-size: 12px;
    font-weight: 500;
  }
  #online-header-right :global(.list-item:hover),
  #online-header-right :global(.list-item.active) {
    color: var(--color-font);
    background: var(--color-surface-raised, var(--color-button-background-hover));
  }
  #online-header-right :global(.label) {
    justify-content: center;
    padding: 6px 0;
    white-space: nowrap;
  }
  @container online-view (max-width: 650px) {
    .header {
      flex-wrap: wrap;
      gap: 8px;
      padding: 10px 12px 6px;
    }
    .primary-nav {
      width: 100%;
    }
    #online-header-right {
      margin-left: 0;
    }
  }
</style>
