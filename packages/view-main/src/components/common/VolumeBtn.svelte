<script lang="ts">
  import PopupBtn from '@/components/material/PopupBtn.svelte'
  import { t } from '@/plugins/i18n'
  import Checkbox from '../base/Checkbox.svelte'
  import SliderBar from '../base/SliderBar.svelte'
  import type { WheelEventHandler } from 'svelte/elements'
  import { actions } from '@/shared/actions'
  import { volume, volumeMute } from '@/modules/player/reactive.svelte'
  let { inline = false }: { inline?: boolean } = $props()
  const muteId = $props.id()
  let label = $derived(
    $volumeMute ? $t('player__volume_muted') : `${$t('player__volume')}${Math.trunc($volume * 100)}%`
  )

  const handleWheel: WheelEventHandler<HTMLButtonElement> = (event) => {
    actions.exec('player.setVolume', Math.round($volume * 100 + (-event.deltaY / 100) * 2) / 100)
  }

  const handleUpdateVolume = (val: number) => {
    actions.exec('player.setVolume', Math.round(val * 100) / 100)
  }

  const handleUpdateVolumeMute = (val: boolean) => {
    actions.exec('player.setVolumeMute', val)
  }

  const icon = $derived(
    $volumeMute
      ? '#icon-volume-mute'
      : $volume == 0
        ? '#icon-volume-off'
        : $volume < 0.3
          ? '#icon-volume-low'
          : $volume < 0.7
            ? '#icon-volume-medium'
            : '#icon-volume-high'
  )
</script>

<div class="volume-control" class:inline>
  {#if inline}
    <div class="inline-volume">
      <button
        type="button"
        class="mute-button"
        aria-label={$t('player__volume_mute_label')}
        aria-pressed={$volumeMute}
        title={label}
        onwheel={handleWheel}
        onclick={() => handleUpdateVolumeMute(!$volumeMute)}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true">
          <path d="M3 8h4l6-5v18l-6-5H3z" />
          {#if $volumeMute}<path d="m17 9 5 6m0-6-5 6" />
          {:else if $volume > 0}<path d="M16 8a5 5 0 0 1 0 8" />{#if $volume >= 0.5}<path d="M19 5a9 9 0 0 1 0 14" />{/if}{/if}
        </svg>
      </button>
      <input
        class="volume-slider"
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={$volume}
        aria-label={$t('player__volume')}
        aria-valuetext={`${Math.trunc($volume * 100)}%`}
        style:--volume-progress={`${($volumeMute ? 0 : $volume) * 100}%`}
        oninput={(event) => handleUpdateVolume(event.currentTarget.valueAsNumber)}
      />
    </div>
  {/if}
  <div class="popup-volume">
    <PopupBtn onwheel={handleWheel} aria-label={label}>
      <div class="icon">
        <svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 24 24">
          <use xlink:href={icon} />
        </svg>
      </div>
      {#snippet content()}
        <div class="setting">
          <div class="info">
            <span>{Math.trunc($volume * 100)}%</span>
            <Checkbox
              id={muteId}
              checked={$volumeMute}
              label={$t('player__volume_mute_label')}
              onchange={handleUpdateVolumeMute}
            />
          </div>
          <SliderBar step={0.01} deltaStep={0.02} value={$volume} min={0} max={1} onchange={handleUpdateVolume} />
        </div>
      {/snippet}
    </PopupBtn>
  </div>
</div>

<style lang="less">
  .volume-control {
    display: flex;
    flex: none;
    align-items: center;
  }
  .inline-volume {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .inline .popup-volume {
    display: none;
  }
  .mute-button,
  .inline .popup-volume :global(> button) {
    display: grid;
    flex: none;
    place-items: center;
    width: var(--player-button-size, 32px);
    height: var(--player-button-size, 32px);
    aspect-ratio: 1;
    padding: 0;
    color: var(--color-font-label);
    cursor: pointer;
    background: none;
    border: none;
    border-radius: 50%;
  }
  .mute-button:hover {
    color: var(--color-font);
  }
  .mute-button svg,
  .inline .icon {
    width: var(--player-icon-size, 24px);
    height: var(--player-icon-size, 24px);
  }
  .volume-slider {
    --volume-fill: var(--color-progress-fill, var(--color-font));
    width: 72px;
    height: 24px;
    padding: 0;
    margin: 0;
    color: var(--color-font);
    cursor: pointer;
    appearance: none;
    background: transparent;
    border: 0;
  }
  .volume-slider::-webkit-slider-runnable-track {
    height: 4px;
    background: linear-gradient(
      to right,
      var(--volume-fill) var(--volume-progress),
      var(--color-progress-track, #555) var(--volume-progress)
    );
    border-radius: 4px;
  }
  .volume-slider::-webkit-slider-thumb {
    width: 12px;
    height: 12px;
    margin-top: -4px;
    appearance: none;
    background: var(--color-font);
    border-radius: 50%;
    opacity: 0;
  }
  .volume-slider::-moz-range-track {
    height: 4px;
    background: var(--color-progress-track, #555);
    border-radius: 4px;
  }
  .volume-slider::-moz-range-progress {
    height: 4px;
    background: var(--volume-fill);
    border-radius: 4px;
  }
  .volume-slider::-moz-range-thumb {
    width: 12px;
    height: 12px;
    background: var(--color-font);
    border: 0;
    border-radius: 50%;
    opacity: 0;
  }
  .inline-volume:hover .volume-slider,
  .volume-slider:focus-visible {
    --volume-fill: var(--color-primary);
  }
  .inline-volume:hover .volume-slider::-webkit-slider-thumb,
  .volume-slider:focus-visible::-webkit-slider-thumb {
    opacity: 1;
  }
  .inline-volume:hover .volume-slider::-moz-range-thumb,
  .volume-slider:focus-visible::-moz-range-thumb {
    opacity: 1;
  }
  @media (max-width: 1000px) {
    .inline-volume {
      display: none;
    }
    .inline .popup-volume {
      display: block;
    }
  }
  // .container {
  //   flex: none;
  //   height: 100%;
  // }

  .icon {
    position: relative;
    display: flex;
    flex-flow: column nowrap;
    align-items: center;
    // color: var(--color-button-font);
    justify-content: center;
    width: 24px;
    padding: 0;
    cursor: pointer;
    transition: color @transition-normal;

    svg {
      opacity: 0.5;
      transition: opacity @transition-fast;
      // filter: drop-shadow(0 0 1px rgba(0, 0, 0, 0.2));
    }
    &:hover {
      svg {
        opacity: 0.9;
      }
    }
    &:active {
      svg {
        opacity: 1;
      }
    }
  }

  .setting {
    display: flex;
    flex-flow: column nowrap;
    gap: 8px;
    width: 140px;
    padding: 2px 3px;

    :global(.slider) {
      width: 100%;
    }
  }

  .info {
    display: flex;
    flex-flow: row nowrap;
    align-items: center;
    justify-content: space-between;
    font-size: 13px;
    span {
      line-height: 1.2;
    }
  }
</style>
