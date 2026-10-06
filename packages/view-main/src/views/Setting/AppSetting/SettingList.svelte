<script lang="ts">
  import { settings, type SettingListSection } from './settings'
  import { t } from '@/plugins/i18n'
  let { active, onchange }: { active?: SettingListSection['id']; onchange: (id: string) => void } = $props()
</script>

<nav class="settings-app-list" aria-label={$t('settings__type_app')}>
  <div class="list">
    {#each settings as item (item.id)}
      <button
        type="button"
        class="list-item"
        class:active={item.id === active}
        aria-current={item.id === active ? 'page' : undefined}
        title={$t(item.name)}
        onclick={() => onchange(item.id)}
      >
        <span>{$t(item.name)}</span>
      </button>
    {/each}
  </div>
</nav>

<style lang="less">
  .settings-app-list {
    flex: none;
    width: 176px;
    min-height: 0;
    padding: 8px;
    border-right: 1px solid var(--color-border);
  }
  .list {
    height: 100%;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: var(--color-border) transparent;
  }
  .list-item {
    position: relative;
    display: flex;
    align-items: center;
    width: 100%;
    min-height: 42px;
    margin: 2px 0;
    padding: 10px 14px;
    color: var(--color-font-label);
    font-size: var(--text-body, 14px);
    font-weight: 450;
    line-height: 1.5;
    text-align: left;
    background: transparent;
    border: 0;
    border-radius: 7px;
    cursor: pointer;
    transition:
      color 150ms,
      background-color 150ms;
  }
  .list-item:hover {
    color: var(--color-font);
    background: var(--color-primary-background-hover);
  }
  .list-item.active {
    color: var(--color-font);
    background: var(--color-surface-raised, var(--color-primary-background));
    font-weight: 600;
  }
  .list-item.active::before {
    position: absolute;
    left: 0;
    top: 14px;
    bottom: 14px;
    width: 3px;
    border-radius: 2px;
    background: var(--color-primary);
    content: '';
  }
  @container (max-width: 620px) {
    .settings-app-list {
      width: 100%;
      height: 56px;
      padding: 4px 12px;
      border-right: 0;
      border-bottom: 1px solid var(--color-border);
    }
    .list {
      display: flex;
      gap: 4px;
      overflow-x: auto;
      overflow-y: hidden;
      scrollbar-width: none;
    }
    .list-item {
      flex: none;
      width: auto;
      min-height: 38px;
      white-space: nowrap;
      font-size: 13px;
    }
    .list-item.active::before {
      display: none;
    }
  }
</style>
