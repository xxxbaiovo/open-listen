<script lang="ts">
  import PlayerProgressBar from '@/components/common/PlayerProgressBar.svelte'
  import { duration, progress } from '@/modules/player/reactive.svelte'

  let { full = false }: { full?: boolean } = $props()
</script>

<div class="middle-play-progress" class:full>
  <span>{$progress.nowPlayTimeStr}</span>
  <div class="progress"><PlayerProgressBar /></div>
  <span>{$duration.label}</span>
</div>

<style lang="less">
  .middle-play-progress {
    display: flex;
    flex: none;
    align-items: center;
    gap: 8px;
    width: 30%;
    min-width: 0;
    color: var(--color-font-label);
    font-size: 11px;
    font-variant-numeric: tabular-nums;
    line-height: 1;
  }
  .middle-play-progress.full {
    width: 100%;
    max-width: 860px;
  }
  .middle-play-progress > span {
    flex: none;
    min-width: 32px;
  }
  .middle-play-progress > span:last-child {
    text-align: right;
  }
  .progress {
    position: relative;
    flex: auto;
    min-width: 0;
    padding: 8px 0;
  }
  .progress :global(> .progress) {
    height: 4px;
  }
  .progress:hover,
  .progress:focus-within {
    --color-progress-fill: var(--color-primary);
  }
</style>
