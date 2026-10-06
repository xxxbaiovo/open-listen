<script lang="ts">
  import Tab from '@/components/base/Tab.svelte'
  import { t } from '@/plugins/i18n'
  import { type ViewType, viewTypes } from './shared'
  import { replace } from '@/plugins/svelte-spa-router/navigator'
  let { activeview }: { activeview: ViewType } = $props()
  const viewList = $derived(
    viewTypes.map((id) => ({ id, label: id === 'extensions' ? $t('extenstion') : $t(`settings__type_${id}`) }))
  )
</script>

<header class="settings-header">
  <div class="heading">
    <div>
      <h1>{$t('setting')}</h1>
      <p>{$t('ui.settings_description')}</p>
    </div>
    {#if activeview !== 'extensions'}
      <span class="autosave"><span aria-hidden="true"></span>{$t('ui.settings_autosave')}</span>
    {/if}
  </div>
  <Tab
    list={viewList}
    itemkey="id"
    itemlabel="label"
    value={activeview}
    onchange={(item) => {
      void replace('/settings', { type: item.id })
    }}
  />
</header>

<style lang="less">
  .settings-header {
    flex: none;
    padding: 26px 32px 18px;
    border-bottom: 1px solid var(--color-border);
  }
  .heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
    margin-bottom: 22px;
  }
  h1 {
    font-size: var(--text-title, 28px);
    font-weight: 650;
    line-height: 1.2;
    letter-spacing: -0.035em;
  }
  p {
    margin-top: 8px;
    color: var(--color-font-label);
    font-size: var(--text-small, 13px);
    line-height: 1.55;
  }
  .autosave {
    display: flex;
    flex: none;
    align-items: center;
    gap: 7px;
    color: var(--color-font-label);
    font-size: var(--text-caption, 12px);
  }
  .autosave > span {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--color-font-label);
  }
  .settings-header :global([role='tablist']) {
    gap: 6px;
    overflow-x: auto;
  }
  .settings-header :global([role='tab']) {
    flex: none;
    padding: 0 16px;
    min-height: 36px;
    color: var(--color-font-label);
    font-size: var(--text-small, 13px);
    font-weight: 550;
    border-radius: 6px;
  }
  .settings-header :global([role='tab'] .label) {
    padding: 8px 0;
  }
  .settings-header :global([role='tab'] .label::after) {
    display: none;
  }
  .settings-header :global([role='tab']:hover) {
    color: var(--color-font);
    background: var(--color-primary-background-hover);
  }
  .settings-header :global([role='tab'][aria-selected='true']) {
    color: var(--color-font);
    background: var(--color-surface-raised, var(--color-primary-background));
    box-shadow: inset 0 1px 0 #ffffff06;
  }
  @container (max-width: 620px) {
    .settings-header {
      padding: 20px 18px 14px;
    }
    .autosave {
      display: none;
    }
    .heading {
      margin-bottom: 16px;
    }
    .settings-header :global([role='tab']) {
      padding: 0 12px;
    }
  }
</style>
