<script lang="ts">
  import type { Snippet } from 'svelte'

  let {
    children,
    padding,
    stacked = false
  }: {
    children: Snippet
    padding?: boolean
    stacked?: boolean
  } = $props()
</script>

<div class="player" class:stacked>
  <div class="bg"></div>
  <div class="player-inner" class:padding>
    {@render children()}
  </div>
</div>

<style lang="less">
  .player {
    position: relative;
    // padding: 6px;
    z-index: 2;
    height: @height-player;
    // border-top: 3px solid var(--color-border);
    // display: flex;
    // flex-flow: row nowrap;
    // align-items: center;
    contain: size layout style;
    // box-shadow: 0 0 6px rgba(0, 0, 0, 0.12);
    // border-top-left-radius: 8px;
    // border-top-right-radius: 8px;
    // backdrop-filter: blur(4px);
    // * {
    //   box-sizing: border-box;
    // }

    // &:before {
    //   .mixin-after();
    //   left: 0;
    //   top: 0;
    //   width: 100%;
    //   height: 100%;
    //   box-shadow: 0 0 6px rgba(0, 0, 0, 0.12);
    //   border-top-left-radius: 8px;
    //   border-top-right-radius: 8px;
    //   // background-color: var(--color-main-background);
    //   // opacity: 0.9;
    //   z-index: -1;
    //   backdrop-filter: blur(4px);
    //   transition: @transition-normal;
    //   transition-property: opacity;
    // }
  }
  .bg {
    width: 100%;
    height: 100%;
    border-top-left-radius: 8px;
    border-top-right-radius: 8px;
    box-shadow: 0 0 6px var(--color-primary-dark-200-alpha-800);
    opacity: 0.8;
    // border-top: 1px solid var(--color-primary-light-300-alpha-800);
    // z-index: -1;
    backdrop-filter: blur(4px);
    transition: @transition-normal;
    transition-property: opacity;
  }
  .player-inner {
    position: absolute;
    top: 0;
    left: 0;
    display: flex;
    flex-flow: row nowrap;
    align-items: center;
    width: 100%;
    height: 100%;
    contain: strict;
    transition: @transition-normal;
    transition-property: opacity;
    &.padding {
      padding-right: 10px;
    }
  }
  .player.stacked {
    --player-icon-size: 16px;
    --player-main-button-size: 32px;
    --player-button-size: 32px;
    --player-indicator-size: 4px;
    --player-control-row-height: 32px;
    height: 88px;
  }
  .player.stacked .player-inner {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 40%) minmax(0, 1fr);
    gap: 0;
    padding: 0 16px;
  }
  @media (max-width: 1000px) {
    .player.stacked .player-inner {
      grid-template-columns: minmax(0, 1fr) minmax(208px, 1.25fr) minmax(0, 1fr);
      gap: 8px;
      padding-right: 12px;
      padding-left: 12px;
    }
  }
  @media (max-width: 700px) {
    .player.stacked {
      height: 144px;
    }
    .player.stacked .player-inner {
      grid-template-columns: minmax(0, 1fr) auto;
      grid-template-rows: 44px 80px;
      gap: 6px 8px;
      padding: 8px 12px;
    }
  }
</style>
