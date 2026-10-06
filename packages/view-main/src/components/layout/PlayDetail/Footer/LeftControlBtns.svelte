<script lang="ts">
  import DesktopLyricBtn from '@/components/common/DesktopLyricBtn/index.svelte'
</script>

{#if import.meta.env.VITE_IS_DESKTOP}
  <div class="desktop-lyric-control">
    <DesktopLyricBtn />
  </div>
{/if}

<style lang="less">
  .desktop-lyric-control {
    display: flex;
    align-items: center;
    color: #b3b3b3;
  }
  .desktop-lyric-control :global(button) {
    min-width: 28px;
    min-height: 32px;
  }
  .desktop-lyric-control :global(svg) {
    width: 16px;
    height: 16px;
  }
</style>
