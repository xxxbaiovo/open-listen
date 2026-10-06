<script lang="ts">
  import { skipNext, skipPrev, togglePlay } from '@/modules/player/actions'
  import { playing } from '@/modules/player/reactive.svelte'
  import { t } from '@/plugins/i18n'
</script>

<div class="transport-buttons">
  <button type="button" class="btn" aria-label={$t('player__prev')} onclick={async () => skipPrev()}>
    <svg viewBox="0 0 24 24" aria-hidden="true"><use xlink:href="#icon-skip-prev" /></svg>
  </button>
  <button
    type="button"
    class="btn main-play"
    aria-label={$playing ? $t('player__pause') : $t('player__play')}
    onclick={togglePlay}
  >
    <svg viewBox="0 0 24 24" aria-hidden="true"><use xlink:href={$playing ? '#icon-pause' : '#icon-play'} /></svg>
  </button>
  <button type="button" class="btn" aria-label={$t('player__next')} onclick={async () => skipNext()}>
    <svg viewBox="0 0 24 24" aria-hidden="true"><use xlink:href="#icon-skip-next" /></svg>
  </button>
</div>

<style lang="less">
  .transport-buttons {
    display: flex;
    flex: none;
    align-items: center;
    gap: 16px;
    height: var(--player-control-row-height, 48px);
  }
  .btn {
    display: grid;
    flex: none;
    place-items: center;
    width: var(--player-button-size, 32px);
    height: var(--player-button-size, 32px);
    aspect-ratio: 1;
    padding: 0;
    color: var(--color-font-label);
    cursor: pointer;
    background: transparent;
    border: none;
    border-radius: 50%;
    transition:
      color 150ms,
      transform 150ms;
  }
  .btn:hover {
    color: var(--color-font);
  }
  .btn svg {
    width: var(--player-icon-size, 24px);
    height: var(--player-icon-size, 24px);
  }
  .main-play {
    width: var(--player-main-button-size, 48px);
    height: var(--player-main-button-size, 48px);
    color: var(--color-play-button-on, var(--color-content-background));
    background: var(--color-play-button, var(--color-font));
  }
  .main-play:hover {
    color: var(--color-play-button-on, var(--color-content-background));
    transform: scale(1.06);
  }
  @media (prefers-reduced-motion: reduce) {
    .main-play:hover {
      transform: none;
    }
  }
  @media (max-width: 1000px) {
    .transport-buttons { gap: 12.8px; }
  }
</style>
