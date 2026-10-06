<script lang="ts">
  import LeftInfo from './LeftInfo/index.svelte'
  import RightLyric from './RightLyric/index.svelte'

  let { introend, focusLyrics }: { introend: boolean; focusLyrics: boolean } = $props()
</script>

<div class="player-detail-main" class:focused={focusLyrics}>
  {#if !focusLyrics}<LeftInfo />{/if}
  <RightLyric {introend} />
</div>

<style lang="less">
  .player-detail-main {
    position: relative;
    display: flex;
    flex: auto;
    min-height: 0;
    overflow: hidden;
    padding: 8px 32px 0;
  }
  .player-detail-main :global(.left-info) {
    width: 40%;
    --content-width: min(76%, calc(100vh - 340px));
  }
  .focused {
    padding: 0;
  }
  .focused :global(.right-lyric) {
    width: 100%;
    min-width: 0;
  }
  @media (max-width: 700px) {
    .player-detail-main {
      flex-direction: column;
      padding: 0 16px;
    }
    .focused {
      padding: 0;
    }
    .player-detail-main :global(.left-info) {
      flex: none;
      flex-direction: row;
      width: 100%;
      height: 108px;
      gap: 14px;
      padding: 6px 0;
      --content-width: 90px;
    }
    .player-detail-main :global(.left-info .info) {
      width: auto;
      max-height: 100%;
      margin: 0;
    }
    .player-detail-main :global(.left-info .info p) {
      font-size: 12px;
    }
    .player-detail-main :global(.left-info .info p span) {
      font-size: 11px;
    }
  }
</style>
