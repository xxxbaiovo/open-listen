<script lang="ts">
  import { t } from '@/plugins/i18n'
  import { queuePanelOpen, toggleQueuePanel } from '@/shared/queuePanel'
</script>

<button
  type="button"
  class="queue-toggle"
  class:active={$queuePanelOpen}
  aria-label={$t('player__list')}
  title={$t('player__list')}
  aria-expanded={$queuePanelOpen}
  aria-controls="queue-panel"
  onclick={(event) => toggleQueuePanel(event.currentTarget)}
>
  <span class="icon">
    <svg viewBox="0 0 24 24" aria-hidden="true"><use xlink:href="#icon-playlist" /></svg>
  </span>
  {#if $queuePanelOpen}<span class="active-dot" aria-hidden="true"></span>{/if}
</button>

<style lang="less">
  .queue-toggle {
    position: relative;
    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 36px;
    padding: 0;
    color: var(--color-font-label);
    cursor: pointer;
    background: transparent;
    border: 0;
    border-radius: 4px;
    transition: color 120ms ease-out;
  }
  .queue-toggle:hover {
    color: var(--color-font);
  }
  .queue-toggle.active {
    color: var(--color-primary);
  }
  .queue-toggle:focus-visible {
    outline: 2px solid currentcolor;
    outline-offset: 2px;
  }
  .icon {
    display: flex;
    width: 20px;
  }
  svg {
    width: 100%;
    height: 100%;
    fill: currentcolor;
  }
  .active-dot {
    position: absolute;
    bottom: 0;
    width: var(--player-indicator-size, 4px);
    height: var(--player-indicator-size, 4px);
    background: currentcolor;
    border-radius: 50%;
  }
  @media (prefers-reduced-motion: reduce) {
    .queue-toggle {
      transition: none;
    }
  }
</style>
