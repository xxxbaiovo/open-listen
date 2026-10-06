<script lang="ts">
  import { verticalScrollbar } from '@/shared/compositions/verticalScrollbar.svelte'
  import { extT } from '@/modules/extension/i18n'
  import { extensionList } from '@/modules/extension/reactive.svelte'
  import { t } from '@/plugins/i18n'
  import type { SourceType } from './shared.svelte'

  let {
    list,
    active,
    onchange,
  }: {
    list: SourceType[]
    active?: string
    onchange: (source: SourceType) => void
  } = $props()

  const selectId = $props.id()
  const providerNames = $derived(new Map($extensionList.map((extension) => [extension.id, extension.name])))
</script>

<aside class="source-list" aria-label={$t('edit_list_modal.remote_list.form_source')}>
  <div class="source-heading">
    <label for={selectId}>{$t('edit_list_modal.remote_list.form_source')}</label>
    <span class="source-count">{list.length}</span>
  </div>
  <select
    id={selectId}
    class="source-select"
    value={active}
    onchange={(event) => {
      const source = list.find((item) => item.sId === event.currentTarget.value)
      if (source && source.sId !== active) onchange(source)
    }}
  >
    {#each list as source (source.sId)}
      <option value={source.sId}>
        {$extT(source.extensionId, source.name)} · {providerNames.get(source.extensionId) ?? source.extensionId}
      </option>
    {/each}
  </select>
  <div class="list" {@attach verticalScrollbar({ offset: '0', scrollbarWidth: '0.3rem' })}>
    {#each list as source (source.sId)}
      {@const name = $extT(source.extensionId, source.name)}
      {@const provider = providerNames.get(source.extensionId) ?? source.extensionId}
      <button
        type="button"
        class="list-item"
        class:active={source.sId === active}
        aria-pressed={source.sId === active}
        aria-label={`${name} · ${provider}`}
        title={`${name} · ${provider}`}
        onclick={() => {
          if (source.sId !== active) onchange(source)
        }}
      >
        <span class="source-name">{name}</span>
        <span class="provider">{provider}</span>
      </button>
    {/each}
  </div>
</aside>

<style lang="less">
  .source-list {
    display: flex;
    flex: none;
    flex-direction: column;
    width: clamp(180px, 23%, 224px);
    min-width: 0;
    min-height: 0;
    margin: 0 0 12px 12px;
    padding-right: 10px;
    overflow: hidden;
    border-right: 1px solid var(--color-border);
  }
  .source-heading {
    display: flex;
    flex: none;
    align-items: center;
    justify-content: space-between;
    height: 32px;
    padding: 0 10px 6px;
    color: var(--color-font-label);
    font-size: 11px;
    font-weight: 600;
    line-height: 1.4;
  }
  .source-count {
    font-size: 10px;
    font-variant-numeric: tabular-nums;
    opacity: 0.7;
  }
  .list {
    flex: 1;
    min-height: 0;
  }
  .list-item {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
    width: 100%;
    min-height: 38px;
    padding: 8px 10px;
    margin-bottom: 2px;
    color: var(--color-font-label);
    font: inherit;
    text-align: left;
    cursor: pointer;
    background: transparent;
    border: 0;
    border-radius: 6px;
    transition:
      color 150ms cubic-bezier(0.2, 0, 0, 1),
      background-color 150ms cubic-bezier(0.2, 0, 0, 1);
  }
  .list-item:hover {
    color: var(--color-font);
    background: var(--color-button-background-hover);
  }
  .list-item.active {
    color: var(--color-font);
    background: var(--color-surface-raised, var(--color-button-background-hover));
  }
  .list-item.active::before {
    position: absolute;
    top: 12px;
    bottom: 12px;
    left: 0;
    width: 2px;
    content: '';
    background: var(--color-primary);
    border-radius: 2px;
  }
  .source-name {
    width: 100%;
    min-width: 0;
    overflow: hidden;
    font-size: 13px;
    font-weight: 500;
    line-height: 1.5;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .provider {
    max-width: 100%;
    overflow: hidden;
    color: var(--color-font-label);
    font-size: 10px;
    font-weight: 400;
    line-height: 1.3;
    text-overflow: ellipsis;
    white-space: nowrap;
    opacity: 0.7;
  }
  .source-select {
    display: none;
  }
  @container online-view (max-width: 650px) {
    .source-list {
      flex-direction: row;
      align-items: center;
      gap: 10px;
      width: auto;
      margin: 0 12px;
      padding: 0 0 4px;
      overflow: visible;
      border: 0;
    }
    .source-heading {
      height: auto;
      gap: 6px;
      padding: 0;
    }
    .list {
      display: none;
    }
    .source-select {
      display: block;
      flex: 1;
      width: 0;
      min-width: 0;
      min-height: 36px;
      padding: 7px 10px;
      color: var(--color-font);
      background: var(--color-surface-raised, var(--color-content-background));
      border: 1px solid var(--color-border);
      border-radius: 6px;
      font: inherit;
      font-size: 12px;
      cursor: pointer;
    }
  }
</style>
