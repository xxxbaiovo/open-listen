<script lang="ts">
  import LyricPlayer from './LyricPlayer.svelte'
  import { onMount } from 'svelte'
  import { isValidLyric } from '@any-listen/common/lyric'
  import { lyricLines } from '@/modules/lyric/reactive.svelte'
  import { lyricLoadState } from '@/modules/lyric/loadState'
  import { restoreCurrentLyric } from '@/modules/lyric/init'
  import { loadMusicLyric } from '@/modules/player/store/playerActions'
  import { playerState } from '@/modules/player/store/state'
  import { playMusicInfo } from '@/modules/player/reactive.svelte'
  import { t } from '@/plugins/i18n'
  let { introend }: { introend: boolean } = $props()
  const loading = $derived($lyricLoadState.trackId === $playMusicInfo?.itemId && $lyricLoadState.status === 'loading')
  const failed = $derived($lyricLoadState.trackId === $playMusicInfo?.itemId && $lyricLoadState.status === 'error')
  const retry = async (refresh = true) => {
    const current = playerState.playMusicInfo
    if (current) await loadMusicLyric(current, refresh)
  }
  onMount(() => {
    // Reuse retained lyrics; a previous transient request failure should not leave an empty page forever.
    if (isValidLyric(playerState.musicInfo.lrc)) restoreCurrentLyric()
    else void retry(false)
  })
</script>

<div class="right-lyric">
  {#if introend}
    <div class="right-lyric-content">
      <LyricPlayer />
      {#if !$lyricLines.length}
        <div class="lyric-empty" role="status">
          <p>{loading ? $t('ui.lyrics_loading') : failed ? $t('lyric__load_error') : $t('ui.lyrics_empty')}</p>
          {#if !loading && $playMusicInfo}<button type="button" onclick={async () => retry()}>{$t('ui.lyrics_retry')}</button>{/if}
        </div>
      {/if}
    </div>
  {/if}
</div>

<style lang="less">
  .right-lyric {
    position: relative;
    flex: auto;
    contain: strict;
  }
  .right-lyric-content {
    position: absolute;
    inset: 0;
    // margin-right: 20px;
  }
  .lyric-empty {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    padding: 24px;
    color: #ffffffb3;
    text-align: center;
    font-size: 16px;
    line-height: 1.5;
  }
  .lyric-empty button {
    padding: 9px 20px;
    font-size: 13px;
    font-weight: 600;
    color: #fff;
    cursor: pointer;
    background: #ffffff14;
    border: 1px solid #ffffff38;
    border-radius: 24px;
  }
  .lyric-empty button:hover { background: #ffffff26; }
</style>
