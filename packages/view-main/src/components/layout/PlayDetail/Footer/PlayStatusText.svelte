<script lang="ts">
  import { playerPlaying, statusText } from '@/modules/player/reactive.svelte'
  let status = $derived($playerPlaying ? '' : $statusText)
</script>

{#if status}<p class="play-status" title={status} role="status">
    {status}
  </p>{/if}

<style lang="less">
  .play-status {
    overflow: hidden;
    color: #b3b3b3;
    font-size: 11px;
    line-height: 1.4;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
