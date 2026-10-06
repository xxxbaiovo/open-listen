<script lang="ts">
  import SvgIcon from '@/components/base/SvgIcon.svelte'
  import { _locale, t } from '@/plugins/i18n'
  import { closeQueuePanel } from '@/shared/queuePanel'
  import { getQueueText, type TabType } from './shared'

  let { active = $bindable() }: { active: TabType } = $props()
  const text = $derived(getQueueText($_locale))
</script>

<div class="queue-header">
  <div class="tabs" role="group" aria-label={$t('player__list')}>
    <button
      type="button"
      class:active={active === 'queue'}
      aria-pressed={active === 'queue'}
      onclick={() => (active = 'queue')}
    >
      {text.queue}
    </button>
    <button
      type="button"
      class:active={active === 'history'}
      aria-pressed={active === 'history'}
      onclick={() => (active = 'history')}
    >
      {text.recent}
    </button>
  </div>
  <button type="button" class="close" aria-label={$t('btn_close')} title={$t('btn_close')} onclick={closeQueuePanel}>
    <SvgIcon name="close" />
  </button>
</div>

<style lang="less">
  .queue-header {
    display: flex;
    flex: none;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    min-height: 64px;
    padding: 8px 12px 0 20px;
  }
  .tabs {
    display: flex;
    gap: 22px;
    min-width: 0;
  }
  button {
    position: relative;
    min-height: 40px;
    padding: 0;
    font-size: 14px;
    font-weight: 650;
    color: var(--color-font-label);
    cursor: pointer;
    background: transparent;
    border: 0;
  }
  button:hover,
  button.active {
    color: var(--color-font);
  }
  button.active::after {
    position: absolute;
    right: 0;
    bottom: 0;
    left: 0;
    height: 2px;
    background: var(--color-primary);
    content: '';
  }
  button:focus-visible {
    outline: 2px solid var(--color-font);
    outline-offset: 3px;
    border-radius: 3px;
  }
  .close {
    display: grid;
    flex: none;
    width: 36px;
    height: 36px;
    min-height: 36px;
    place-items: center;
    border-radius: 50%;
  }
  .close :global(svg) { width: 16px; height: 16px; }
  .close:hover {
    background: var(--color-primary-background-hover);
  }
  @container (max-width: 280px) {
    .queue-header {
      gap: 4px;
      padding-inline: 10px 6px;
    }
    .tabs {
      gap: 12px;
    }
    button {
      font-size: 12px;
    }
    .close {
      width: 28px;
      height: 28px;
      min-height: 28px;
    }
  }
</style>
