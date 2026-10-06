<script lang="ts">
  import Header from './Header.svelte'
  import { query } from '@/plugins/routes'
  import { viewTypes } from './shared'
  const activeView = $derived<(typeof viewTypes)[number]>(viewTypes.find((t) => t == $query.type) ?? 'app')
</script>

<div class="view-container settings-page">
  <Header activeview={activeView} />
  {#if activeView == 'app'}
    {#await import('./AppSetting/AppSetting.svelte') then { default: AppSetting }}<AppSetting />{/await}
  {:else if activeView == 'extensions'}
    {#await import('../Extenstion/index.svelte') then { default: ExtensionManager }}<ExtensionManager />{/await}
  {:else if activeView == 'extension'}
    {#await import('./ExtensionSetting/ExtensionSetting.svelte') then { default: ExtensionSetting }}<ExtensionSetting />{/await}
  {:else if activeView == 'logs'}
    {#await import('./Logs/Logs.svelte') then { default: Logs }}<Logs />{/await}
  {/if}
</div>

<style lang="less">
  .settings-page {
    display: flex;
    flex-direction: column;
    min-height: 0;
    font-size: var(--text-body, 14px);
    line-height: 1.55;
  }
  .settings-page :global(.settings-list) {
    padding: 18px 32px 40px;
    margin: 0;
  }
  .settings-page :global(.settings-title) {
    padding: 0;
    margin: 0 0 22px;
    border: 0;
    font-size: 22px;
    font-weight: 600;
    line-height: 1.25;
    letter-spacing: -0.025em;
  }
  .settings-page :global(.settings-item) {
    padding: 22px 0;
    border-bottom: 1px solid var(--color-border);
  }
  .settings-page :global(.settings-item:last-child) {
    border-bottom: 0;
  }
  .settings-page :global(.setting-toggle) {
    padding: 6px 0;
  }
  .settings-page :global(.setting-toggle + .setting-toggle) {
    border-top: 0;
  }
  .settings-page :global(.settings-item-title-container) {
    padding: 0;
  }
  .settings-page :global(.settings-item-title-content) {
    padding: 0;
    margin-bottom: 12px;
  }
  .settings-page :global(.settings-item-title) {
    color: var(--color-font);
    font-size: var(--text-body, 14px);
    font-weight: 550;
    line-height: 1.5;
  }
  .settings-page :global(.settings-item-desc) {
    margin-top: 6px;
    color: var(--color-font-label);
    font-size: var(--text-small, 13px);
    line-height: 1.6;
    opacity: 1;
    max-width: 72ch;
    text-wrap: pretty;
  }
  .settings-page :global(.settings-item-content),
  .settings-page :global(.settings-item-input),
  .settings-page :global(.settings-item-config-checkbox),
  .settings-page :global(.settings-item-selection) {
    margin-left: 0;
  }
  .settings-page :global(.settings-item-content-item) {
    flex-wrap: wrap;
    gap: 10px;
  }
  .settings-page :global(.settings-item-checkbox .checkbox) {
    margin-bottom: 0;
  }
  .settings-page :global(.p) {
    padding: 6px 0;
    line-height: 1.6;
  }
  .settings-page :global(.p .btn + .btn) {
    margin-left: 10px;
  }
  .settings-page :global(input:not([type='radio'], [type='checkbox'])) {
    min-height: 40px;
    border-radius: 7px;
  }
  .settings-page :global(.custom-scrollbar-thumb) {
    background: var(--color-font-label);
    opacity: 0.3;
  }
  @container (max-width: 620px) {
    .settings-page :global(.settings-list) {
      padding: 22px 18px 32px;
    }
    .settings-page :global(.settings-title) {
      font-size: 20px;
      margin-bottom: 18px;
    }
    .settings-page :global(input:not([type='radio'], [type='checkbox'])) {
      max-width: 100%;
      font-size: 16px;
    }
  }
</style>
