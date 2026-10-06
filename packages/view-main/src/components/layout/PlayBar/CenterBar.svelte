<script lang="ts">
  import PlayInfo from './components/PlayInfo.svelte'
  import Pic from './components/Pic.svelte'
  import Container from './components/Container.svelte'
  import PlayBtns from './components/PlayBtns.svelte'
  import MiddlePlayProgress from './components/MiddlePlayProgress.svelte'
  import TogglePlayModeBtn from '@/components/common/TogglePlayModeBtn.svelte'
  import VolumeBtn from '@/components/common/VolumeBtn.svelte'
  import PlaylistBtn from '@/components/common/PlaylistBtn/index.svelte'
  import PlayerMusicHeartBtn from '@/components/common/PlayerMusicHeartBtn.svelte'
  import AudioOutputBtn from '@/components/common/AudioOutputBtn.svelte'
  import SvgIcon from '@/components/base/SvgIcon.svelte'
  import { setShowPlayDetail } from '@/modules/playDetail/store/action'
  import { isShowPlayDetail } from '@/modules/playDetail/reactive.svelte'
  import { t } from '@/plugins/i18n'
  import { playMusicInfo } from '@/modules/player/reactive.svelte'
  import { startPointerMusicDrag } from '@/shared/musicDrag.svelte'
</script>

<Container stacked>
  <div class="now-playing" role="group" aria-label={$playMusicInfo?.musicInfo.name}
    data-music-draggable={!!$playMusicInfo}
    onpointerdown={(event) => { if ($playMusicInfo) startPointerMusicDrag(event, [$playMusicInfo.musicInfo]) }}
    onmousedown={(event) => { if ($playMusicInfo) startPointerMusicDrag(event, [$playMusicInfo.musicInfo]) }}
  >
    <Pic compact />
    <div class="track-copy">
      <PlayInfo>
        {#snippet trailing()}<span class="heart"><PlayerMusicHeartBtn /></span>{/snippet}
      </PlayInfo>
    </div>
  </div>
  <div class="transport">
    <div class="transport-buttons">
      <span class="mode"><TogglePlayModeBtn kind="shuffle" /></span>
      <PlayBtns />
      <span class="mode"><TogglePlayModeBtn kind="repeat" /></span>
    </div>
    <MiddlePlayProgress full />
  </div>
  <div class="tools">
    <button class="lyrics-btn" class:active={$isShowPlayDetail}
      aria-label={$isShowPlayDetail ? $t('play_detail.hide_tip') : $t('ui.open_lyrics')}
      aria-pressed={$isShowPlayDetail} onclick={() => setShowPlayDetail(!$isShowPlayDetail)}>
      <SvgIcon name="lyric" />
    </button>
    <PlaylistBtn />
    <AudioOutputBtn />
    <VolumeBtn inline />
  </div>
</Container>

<style lang="less">
  .now-playing {
    display: flex;
    align-items: center;
    gap: 16px;
    min-width: 0;
    height: 56px;
  }
  .track-copy {
    flex: 1;
    min-width: 0;
  }
  .heart {
    flex: none;
  }
  .heart :global(.btn) {
    width: var(--player-button-size);
    height: var(--player-button-size);
    aspect-ratio: 1;
    padding: 0;
  }
  .heart :global(.btn.icon svg) {
    width: var(--player-icon-size);
    height: var(--player-icon-size);
    filter: none;
  }
  .transport {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-self: center;
    gap: 8px;
    width: 100%;
    max-width: 568px;
    min-width: 0;
  }
  .transport-buttons {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    height: var(--player-control-row-height);
  }
  .mode {
    display: grid;
    flex: none;
    place-items: center;
    width: var(--player-button-size);
    height: var(--player-button-size);
  }
  .mode :global(button) {
    width: var(--player-button-size);
    min-width: var(--player-button-size);
    height: var(--player-button-size);
    min-height: var(--player-button-size);
    aspect-ratio: 1;
  }
  .mode :global(svg) {
    width: var(--player-icon-size);
    height: var(--player-icon-size);
  }
  .tools {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 0;
    min-width: 0;
    color: var(--color-font-label);
  }
  .tools :global(> button) {
    display: grid;
    flex: none;
    place-items: center;
    width: var(--player-button-size);
    min-width: var(--player-button-size);
    height: var(--player-button-size);
    min-height: var(--player-button-size);
    aspect-ratio: 1;
    border-radius: 50%;
  }
  .tools :global(> button > .icon) {
    width: var(--player-icon-size);
  }
  .tools :global(> button svg) {
    width: var(--player-icon-size);
    height: var(--player-icon-size);
  }
  .lyrics-btn {
    position: relative;
    padding: 0;
    color: inherit;
    cursor: pointer;
    background: none;
    border: none;
    border-radius: 50%;
  }
  .lyrics-btn:hover {
    color: var(--color-font);
  }
  .lyrics-btn.active {
    color: var(--color-primary);
  }
  .lyrics-btn.active::after {
    position: absolute;
    bottom: 0;
    width: var(--player-indicator-size);
    height: var(--player-indicator-size);
    content: '';
    background: currentColor;
    border-radius: 50%;
  }
  @media (max-width: 1000px) {
    .transport-buttons { gap: 9.6px; }
    .tools {
      gap: 4px;
    }
  }
  @media (max-width: 700px) {
    .now-playing {
      grid-column: 1;
      grid-row: 1;
      gap: 8px;
      height: 40px;
    }
    .tools {
      grid-column: 2;
      grid-row: 1;
      gap: 2px;
    }
    .transport {
      grid-column: 1 / -1;
      grid-row: 2;
      gap: 8px;
      max-width: 560px;
    }
  }
</style>
