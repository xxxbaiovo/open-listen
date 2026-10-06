<script lang="ts">
  import SvgIcon from '@/components/base/SvgIcon.svelte'
  import { useNextTogglePlay } from '@/shared/compositions/useNextTogglePlay.svelte'
  import { t } from '@/plugins/i18n'
  let { kind = 'all' }: { kind?: 'all' | 'shuffle' | 'repeat' } = $props()

  const nextTogglePlay = useNextTogglePlay()
  const active = $derived(kind === 'shuffle' ? nextTogglePlay.shuffle
    : kind === 'repeat' ? nextTogglePlay.repeat !== 'off' : nextTogglePlay.active)
  const icon = $derived(kind === 'shuffle' ? 'list-random'
    : kind === 'repeat' ? nextTogglePlay.repeat === 'one' ? 'list-single-loop' : 'list-loop' : nextTogglePlay.icon)
  const name = $derived(kind === 'shuffle' ? $t(active ? 'ui.shuffle_off' : 'ui.shuffle_on')
    : kind === 'repeat' ? $t(nextTogglePlay.repeat === 'off' ? 'ui.repeat_off'
      : nextTogglePlay.repeat === 'one' ? 'player__play_toggle_mode_single_loop' : 'player__play_toggle_mode_list_loop') : nextTogglePlay.name)

  const keepNativeActivation = (event: KeyboardEvent) => {
    // The app-wide keyup handler prevents native Space activation on buttons.
    if (event.key === ' ' || event.key === 'Enter') event.stopPropagation()
  }
</script>

<button
  type="button"
  class="play-mode-button"
  class:active
  aria-label={name}
  aria-pressed={active}
  title={name}
  onclick={kind === 'shuffle' ? nextTogglePlay.toggleShuffle : kind === 'repeat' ? nextTogglePlay.nextRepeat : nextTogglePlay.nextMode}
  onkeydown={keepNativeActivation}
  onkeyup={keepNativeActivation}
>
  <SvgIcon name={icon} />
  {#if active}<span class="mode-indicator" aria-hidden="true"></span>{/if}
</button>

<style lang="less">
  .play-mode-button {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    padding: 0;
    color: var(--color-font-label);
    cursor: pointer;
    background: transparent;
    border: 0;
    border-radius: 50%;
    transition:
      color 120ms ease-out,
      scale 120ms cubic-bezier(0.2, 0, 0, 1);

    &:hover {
      color: var(--color-font);
    }

    &.active {
      color: var(--color-primary);
    }

    &:active {
      scale: 0.96;
    }

    &:focus-visible {
      outline: 2px solid currentcolor;
      outline-offset: 2px;
    }
  }

  .mode-indicator {
    position: absolute;
    bottom: 2px;
    width: var(--player-indicator-size, 4px);
    height: var(--player-indicator-size, 4px);
    pointer-events: none;
    background: currentcolor;
    border-radius: 50%;
  }

  @media (prefers-reduced-motion: reduce) {
    .play-mode-button {
      transition: none;

      &:active {
        scale: 1;
      }
    }
  }
</style>
