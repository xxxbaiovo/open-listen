<script lang="ts">
  import VolumeBtn from '@/components/common/VolumeBtn.svelte'
  import PlaylistBtn from '@/components/common/PlaylistBtn/index.svelte'
  import SvgIcon from '@/components/base/SvgIcon.svelte'
  import { setShowPlayDetail } from '@/modules/playDetail/store/action'
  import { t } from '@/plugins/i18n'
</script>

<div class="utility-controls">
  <button
    class="lyrics-btn"
    aria-label={$t('close')}
    title={$t('close')}
    aria-pressed="true"
    onclick={() => setShowPlayDetail(false)}
  >
    <SvgIcon name="lyric" />
  </button>
  <PlaylistBtn />
  <VolumeBtn inline />
</div>

<style lang="less">
  .utility-controls {
    display: flex;
    flex: none;
    align-items: center;
    gap: 8px;
    color: var(--color-font-label);
  }
  .utility-controls :global(> button) {
    display: grid;
    place-items: center;
    width: 28px;
    min-width: 28px;
    height: 32px;
    min-height: 32px;
  }
  .utility-controls :global(> button > .icon) {
    width: 16px;
  }
  .utility-controls :global(> button > .icon svg),
  .lyrics-btn :global(svg) {
    width: 16px;
    height: 16px;
  }
  .lyrics-btn {
    position: relative;
    padding: 0;
    color: var(--color-primary);
    cursor: pointer;
    background: none;
    border: none;
    border-radius: 4px;
  }
  .lyrics-btn::after {
    position: absolute;
    bottom: 0;
    width: 3px;
    height: 3px;
    content: '';
    background: currentColor;
    border-radius: 50%;
  }
  @media (max-width: 1000px) {
    .utility-controls {
      gap: 4px;
    }
  }
  @media (max-width: 700px) {
    .utility-controls {
      gap: 2px;
    }
  }
</style>
