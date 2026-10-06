<script lang="ts">
  import Image from '@/components/base/Image.svelte'
  import { scrollListTo } from '@/modules/app/store/action'
  import { setShowPlayDetail } from '@/modules/playDetail/store/commit'
  import { musicInfo } from '@/modules/player/reactive.svelte'
  import { playerState } from '@/modules/player/store/state'
  import { t } from '@/plugins/i18n'
  let { compact = false }: { compact?: boolean } = $props()
  let pic = $derived($musicInfo.pic)
</script>

<div class="container" class:compact>
  <button
    type="button"
    class="btn"
    data-music-drag-handle={compact || undefined}
    ondragstart={(event) => event.preventDefault()}
    aria-label={$t('ui.open_lyrics')}
    onclick={() => {
      setShowPlayDetail(true)
    }}
    oncontextmenu={() => {
      let mInfo = playerState.playMusicInfo
      if (!mInfo) return
      scrollListTo(mInfo.listId, mInfo.source, mInfo.musicInfo)
    }}
  >
    <Image decoding="auto" loading="eager" src={pic} />
  </button>
</div>

<style lang="less">
  .container {
    flex: none;
    min-width: 0;
    // width: @height-player;
    height: 100%;
    padding: 8px 10px;
  }
  .btn {
    display: block;
    height: 100%;
    aspect-ratio: 1;
    // aspect-ratio: 1;
    padding: 0;
    cursor: pointer;
    background: none;
    border: none;
    transition: opacity @transition-fast;

    &:hover {
      opacity: 0.6;
    }
  }
  .container.compact {
    width: 56px;
    height: 56px;
    padding: 0;
  }
  .compact .btn {
    overflow: hidden;
    border-radius: 4px;
  }
  @media (max-width: 700px) {
    .container.compact {
      width: 40px;
      height: 40px;
    }
  }
</style>
