<script lang="ts">
  import { t } from '@/plugins/i18n'
  import { closeWindow, maximizeWindow, minWindow } from '@/shared/ipc/app'
  import { isWindowMaximized } from '@/shared/browser/windowState'
</script>

<div class="control no-drag">
  <button type="button" class="btn" aria-label={$t('min')} title={$t('min')} onclick={minWindow}>
    <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h10" /></svg>
  </button>
  <button type="button" class="btn" aria-label={$isWindowMaximized ? $t('maximized_exit') : $t('maximized')}
    title={$isWindowMaximized ? $t('maximized_exit') : $t('maximized')} onclick={maximizeWindow}>
    <svg viewBox="0 0 16 16" aria-hidden="true">
      {#if $isWindowMaximized}
        <path d="M5 3h8v8M3 5h8v8H3Z" />
      {:else}
        <path d="M3 3h10v10H3Z" />
      {/if}
    </svg>
  </button>
  <button type="button" class="btn close" aria-label={$t('close')} title={$t('close')} onclick={closeWindow}>
    <svg viewBox="0 0 16 16" aria-hidden="true"><path d="m3 3 10 10M3 13 13 3" /></svg>
  </button>
</div>

<style lang="less">
  .control {
    display: flex;
    flex: none;
    align-items: center;
    height: 32px;
  }
  .btn {
    display: grid;
    place-items: center;
    width: 44px;
    height: 32px;
    padding: 0;
    color: var(--color-font-label);
    cursor: pointer;
    background: none;
    border: 0;
    border-radius: 3px;
    -webkit-app-region: no-drag;
  }
  .btn svg {
    display: block;
    width: 16px;
    height: 16px;
    fill: none;
    stroke: currentColor;
    stroke-width: 1;
    pointer-events: none;
  }
  .btn:active { scale: none; }
  .btn:hover { color: var(--color-font); background: var(--color-button-background-hover); }
  .close:hover { color: #fff; background: var(--color-btn-close); }
</style>
