<script lang="ts">
  import { addListMusics, removeListMusics } from '@/modules/musicLibrary/actions'
  import { musicLibraryEvent } from '@/modules/musicLibrary/store/event'
  import { checkCollectMusic } from '@/modules/player/store/actions'
  import { t } from '@/plugins/i18n'
  import { LIST_IDS } from '@any-listen/common/constants'
  import { onMount } from 'svelte'
  import { showNotify } from '@/components/apis/notify'

  let {
    musicinfo,
    min = false,
    link = false,
    circle = false,
  }: {
    musicinfo?: AnyListen.Music.MusicInfo | null
    min?: boolean
    link?: boolean
    circle?: boolean
  } = $props()

  let loved = $state(false)
  let pending = $state(false)
  let celebration = $state(0)
  let celebrationTimer: ReturnType<typeof setTimeout> | undefined
  const confetti = [
    [-26, -12, -80], [-24, -27, 25], [-14, -32, -35], [-4, -25, 75],
    [8, -33, -15], [20, -27, 55], [28, -15, -65], [25, -3, 30],
    [-20, 2, 60], [-9, -17, -50], [13, -18, 85], [5, -10, 15],
  ]
  const stopCelebration = () => {
    clearTimeout(celebrationTimer)
    celebration = 0
  }
  const celebrate = () => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    clearTimeout(celebrationTimer)
    celebration++
    celebrationTimer = setTimeout(stopCelebration, 850)
  }
  let requestVersion = 0
  const handleLoveListChange = async (id?: string) => {
    const version = ++requestVersion
    const value = await checkCollectMusic(id)
    if (version === requestVersion && id === musicinfo?.id) loved = value
  }

  $effect(() => {
    stopCelebration()
    loved = false
    void handleLoveListChange(musicinfo?.id)
  })

  onMount(() => {
    const unsubscribe = musicLibraryEvent.on('listMusicChanged', (ids) => {
      if (!ids.includes(LIST_IDS.LOVE)) return
      void handleLoveListChange(musicinfo?.id)
    })
    return () => {
      stopCelebration()
      requestVersion++
      unsubscribe()
    }
  })

  const toggleFavorite = async (event: MouseEvent) => {
    event.stopPropagation()
    if (!musicinfo || pending) return
    const track = musicinfo
    const nextLoved = !loved
    pending = true
    requestVersion++
    try {
      // Favorite membership only changes in the liked list, never in the source playlist.
      if (nextLoved) await addListMusics(LIST_IDS.LOVE, [track])
      else await removeListMusics(LIST_IDS.LOVE, [track.id])
      if (musicinfo?.id === track.id) {
        requestVersion++
        // eslint-disable-next-line require-atomic-updates -- Apply the captured intent only to the same track; pending blocks another click.
        loved = nextLoved
        if (nextLoved) celebrate()
        else stopCelebration()
      }
    } catch (error) {
      showNotify(error instanceof Error ? error.message : String(error))
    } finally {
      // eslint-disable-next-line require-atomic-updates -- This is the only mutation allowed while pending is true.
      pending = false
    }
  }
  const keepNativeActivation = (event: KeyboardEvent) => {
    if (event.key === ' ' || event.key === 'Enter') event.stopPropagation()
  }
</script>

<div class="music-heart-btn" class:loved>
  <button
    type="button"
    class="btn icon"
    class:min
    class:link
    disabled={!musicinfo || pending}
    aria-pressed={loved}
    onclick={toggleFavorite}
    ondblclick={(event) => event.stopPropagation()}
    onkeydown={keepNativeActivation}
    onkeyup={keepNativeActivation}
    aria-label={loved ? $t('music_unlove') : $t('music_love')}
    title={loved ? $t('music_unlove') : $t('music_love')}
  >
    <span class="favorite-visual" class:celebrating={celebration > 0}>
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill={!circle && loved ? 'currentColor' : 'none'}
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      {#if circle}
        <circle class="favorite-circle" cx="12" cy="12" r="11" fill={loved ? 'currentColor' : 'none'} />
        <path class="favorite-plus" class:visible={!loved} d="M12 7.5v9M7.5 12h9" />
        <path class="favorite-check" class:visible={loved} pathLength="1" d="m7.5 12 3 3 6-6" />
      {:else}<path
        d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z"
      />
      {/if}
    </svg>
    {#if celebration}
      {#key celebration}
        <span class="confetti" aria-hidden="true">
          {#each confetti as [x, y, rotation], index (index)}
            <i style:--x={`${x}px`} style:--y={`${y}px`} style:--rotation={`${rotation}deg`} style:--delay={`${index % 3 * 25}ms`}></i>
          {/each}
        </span>
      {/key}
    {/if}
    </span>
  </button>
</div>

<style lang="less">
  .music-heart-btn {
    display: flex;
    flex: none;
  }
  .btn {
    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    padding: 6px;
    color: var(--color-font-label);
    cursor: pointer;
    background: transparent;
    border: 0;
    border-radius: 50%;
    transition: color 120ms ease-out;
  }
  .btn:hover {
    color: var(--color-font);
  }
  .btn:disabled {
    cursor: default;
  }
  .btn:focus-visible {
    outline: 2px solid currentcolor;
    outline-offset: 2px;
  }
  .loved .btn {
    color: var(--color-primary);
  }
  .btn.icon svg {
    flex: none;
    width: 18px;
    height: 18px;
    aspect-ratio: 1;
    filter: none;
  }
  .favorite-visual {
    position: relative;
    display: grid;
    flex: none;
    place-items: center;
    width: var(--player-icon-size, 18px);
    height: var(--player-icon-size, 18px);
    pointer-events: none;
  }
  .favorite-circle {
    transition: fill 180ms ease-out;
  }
  .favorite-plus {
    opacity: 0;
    transform: rotate(90deg) scale(0.5);
    transform-origin: center;
    transition: opacity 140ms, transform 180ms;
  }
  .favorite-plus.visible {
    opacity: 1;
    transform: rotate(0) scale(1);
  }
  .favorite-check {
    fill: none;
    stroke: var(--color-accent-on, #101010);
    stroke-width: 1.5;
    stroke-dasharray: 1;
    stroke-dashoffset: 1;
    opacity: 0;
    transition: stroke-dashoffset 240ms ease-out 80ms, opacity 120ms;
  }
  .favorite-check.visible {
    stroke-dashoffset: 0;
    opacity: 1;
  }
  .celebrating > svg {
    animation: favorite-pop 450ms cubic-bezier(0.2, 0.8, 0.2, 1);
  }
  .confetti {
    position: absolute;
    top: 50%;
    left: 50%;
    z-index: 2;
    width: 0;
    height: 0;
    pointer-events: none;
  }
  .confetti i {
    position: absolute;
    width: 2.5px;
    height: 4px;
    background: var(--color-primary);
    border-radius: 0.5px;
    opacity: 0;
    animation: favorite-confetti 720ms cubic-bezier(0.16, 0.7, 0.3, 1) var(--delay) both;
  }
  .confetti i:nth-child(3n) { background: color-mix(in srgb, var(--color-primary), white 45%); }
  .confetti i:nth-child(3n + 1) { width: 2px; height: 2px; }
  @keyframes favorite-pop {
    0% { transform: scale(0.75); }
    45% { transform: scale(1.18); }
    75% { transform: scale(0.96); }
    100% { transform: scale(1); }
  }
  @keyframes favorite-confetti {
    0% { opacity: 0; transform: translate(-50%, -6px) rotate(0) scale(0.3); }
    18% { opacity: 1; }
    55% { opacity: 1; transform: translate(var(--x), var(--y)) rotate(var(--rotation)) scale(1); }
    100% { opacity: 0; transform: translate(var(--x), calc(var(--y) + 12px)) rotate(calc(var(--rotation) + 90deg)) scale(0.5); }
  }
  @media (prefers-reduced-motion: reduce) {
    .celebrating > svg, .confetti i { animation: none; }
    .confetti { display: none; }
    .favorite-circle, .favorite-plus, .favorite-check { transition: none; }
  }
</style>
