<script lang="ts">
  import type { Snippet } from 'svelte'
  import { musicInfo } from '@/modules/player/reactive.svelte'
  let { trailing }: { trailing?: Snippet } = $props()
</script>

<div class="track-info" class:with-action={!!trailing}>
  <p class="name" title={$musicInfo.name}>{$musicInfo.name}</p>
  <p class="artist" title={$musicInfo.singer}>{$musicInfo.singer}</p>
  {#if trailing}<div class="track-action">{@render trailing()}</div>{/if}
</div>

<style lang="less">
  .track-info {
    display: flex;
    flex: auto;
    flex-direction: column;
    gap: 3px;
    min-width: 0;
  }
  p {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    line-height: 1.4;
  }
  .name {
    color: var(--color-font);
    font-size: var(--text-body, 14px);
    font-weight: 550;
  }
  .artist {
    color: var(--color-font-label);
    font-size: var(--text-caption, 12px);
    font-weight: 400;
  }
  .status-text {
    color: var(--color-font-label);
    font-size: 11px;
  }
  .with-action {
    display: grid;
    grid-template-columns: minmax(0, max-content) minmax(32px, 1fr);
    grid-template-rows: 20px 18px;
    gap: 0 16px;
    align-items: center;
  }
  .with-action .name {
    grid-row: 1;
    grid-column: 1;
    line-height: 19px;
  }
  .with-action .artist {
    grid-row: 2;
    grid-column: 1;
    line-height: 17px;
  }
  .track-action {
    display: flex;
    grid-row: 1 / 3;
    grid-column: 2;
    align-items: center;
    justify-self: start;
    height: 32px;
  }
  .with-action .status-text {
    grid-row: 3;
    grid-column: 1 / -1;
    min-width: 0;
    line-height: 16px;
  }
  @media (max-width: 700px) {
    .with-action {
      grid-template-rows: 19px 17px;
    }
    .status-text {
      display: none;
    }
  }
</style>
