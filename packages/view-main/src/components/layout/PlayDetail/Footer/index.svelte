<script lang="ts">
  import Image from '@/components/base/Image.svelte'
  import PlayerMusicHeartBtn from '@/components/common/PlayerMusicHeartBtn.svelte'
  import TogglePlayModeBtn from '@/components/common/TogglePlayModeBtn.svelte'
  import { musicInfo, playMusicInfo } from '@/modules/player/reactive.svelte'
  import { startPointerMusicDrag } from '@/shared/musicDrag.svelte'
  import RightControlBtns from './RightControlBtns.svelte'
  import LeftControlBtns from './LeftControlBtns.svelte'
  import MiddlePlayProgress from './MiddlePlayProgress.svelte'
  import PlayBtns from './PlayBtns.svelte'
  import PlayStatusText from './PlayStatusText.svelte'

  let { introend }: { introend: boolean } = $props()
</script>

<div class="footer">
  {#if introend}
    <div class="player-footer-content">
      <div class="now-playing" role="group" aria-label={$musicInfo.name}
        data-music-draggable={!!$playMusicInfo}
        onpointerdown={(event) => { if ($playMusicInfo) startPointerMusicDrag(event, [$playMusicInfo.musicInfo]) }}
        onmousedown={(event) => { if ($playMusicInfo) startPointerMusicDrag(event, [$playMusicInfo.musicInfo]) }}
      >
        <div class="cover">
          <Image src={$musicInfo.pic} alt="" loading="eager" decoding="auto" />
        </div>
        <div class="track-info">
          <p class="name" title={$musicInfo.name}>{$musicInfo.name}</p>
          <p class="artist" title={$musicInfo.singer}>{$musicInfo.singer}</p>
          <PlayStatusText />
        </div>
        <span class="heart"><PlayerMusicHeartBtn /></span>
      </div>
      <div class="transport">
        <div class="transport-row">
          <span class="mode"><TogglePlayModeBtn kind="shuffle" /></span>
          <PlayBtns />
          <span class="mode"><TogglePlayModeBtn kind="repeat" /></span>
        </div>
        <MiddlePlayProgress />
      </div>
      <div class="tools">
        <LeftControlBtns />
        <RightControlBtns />
      </div>
    </div>
  {/if}
</div>

<style lang="less">
  .footer {
    --color-font: #f5f5f5;
    --color-font-label: #b3b3b3;
    --color-button-font: #e6e6e6;
    --color-play-button: #fff;
    --color-play-button-on: #111;
    --color-progress-fill: #fff;
    --color-progress-track: #4d4d4d;
    position: relative;
    z-index: 3;
    flex: none;
    height: 88px;
    color: #f5f5f5;
    background: #0b0b0b;
  }
  .player-footer-content {
    position: relative;
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(220px, 1.45fr) minmax(0, 1fr);
    align-items: center;
    height: 100%;
    gap: 16px;
    padding: 10px 16px;
  }
  .now-playing {
    display: flex;
    align-items: center;
    min-width: 0;
    gap: 12px;
  }
  .cover {
    flex: none;
    width: 56px;
    height: 56px;
    overflow: hidden;
    border-radius: 4px;
  }
  .track-info {
    flex: 0 1 auto;
    min-width: 0;
  }
  .name,
  .artist {
    overflow: hidden;
    line-height: 1.45;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .name {
    font-size: 14px;
    font-weight: 550;
  }
  .artist {
    margin-top: 3px;
    color: #b3b3b3;
    font-size: 12px;
  }
  .heart {
    flex: none;
    margin-left: -4px;
  }
  .heart :global(.btn) {
    width: 28px;
    height: 32px;
  }
  .heart :global(.btn.icon svg) {
    width: 16px;
    height: 16px;
    filter: none;
  }
  .transport {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-self: center;
    gap: 2px;
    width: 100%;
    max-width: 560px;
    min-width: 0;
  }
  .transport-row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    width: 100%;
    height: 40px;
  }
  .mode {
    display: grid;
    flex: none;
    place-items: center;
    width: 28px;
    height: 32px;
  }
  .mode :global(button) {
    width: 28px;
    min-width: 28px;
    height: 32px;
    min-height: 32px;
  }
  .mode :global(svg) {
    width: 16px;
    height: 16px;
  }
  .tools {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
    min-width: 0;
  }
  @media (max-width: 1000px) {
    .player-footer-content {
      grid-template-columns: minmax(0, 1fr) minmax(208px, 1.25fr) minmax(0, 1fr);
      gap: 8px;
      padding-right: 12px;
      padding-left: 12px;
    }
    .tools {
      gap: 4px;
    }
  }
  @media (max-width: 700px) {
    .footer {
      height: 126px;
    }
    .player-footer-content {
      grid-template-columns: minmax(0, 1fr) auto;
      grid-template-rows: 44px 58px;
      gap: 6px 8px;
      padding: 8px 12px;
    }
    .now-playing {
      grid-column: 1;
      grid-row: 1;
      gap: 8px;
    }
    .cover {
      width: 40px;
      height: 40px;
    }
    .name {
      font-size: 13px;
    }
    .artist {
      margin-top: 1px;
      font-size: 11px;
    }
    .heart {
      margin-left: 0;
    }
    .transport {
      grid-column: 1 / -1;
      grid-row: 2;
    }
    .tools {
      grid-column: 2;
      grid-row: 1;
      gap: 2px;
    }
  }
</style>
