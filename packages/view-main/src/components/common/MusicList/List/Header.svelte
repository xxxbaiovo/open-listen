<script lang="ts">
  import SvgIcon from '@/components/base/SvgIcon.svelte'
  import { t } from '@/plugins/i18n'

</script>

<div class="header">
  <div class="num">
    #
  </div>
  <span class="title">{$t('music_name')}</span>
  <span class="album">{$t('music_album')}</span>
  <span class="time" role="img" aria-label={$t('music_time')} title={$t('music_time')}>
    <SvgIcon name="clock" />
  </span>
</div>

<style lang="less">
  .header {
    display: grid;
    flex: none;
    grid-template-columns: 32px minmax(0, 1fr) minmax(100px, 26%) 64px;
    gap: 14px;
    align-items: center;
    height: 38px;
    padding: 0 12px;
    margin: 0 22px 6px;
    border-bottom: 1px solid var(--color-border);
    font-size: 13px;
    color: var(--color-font-label);

    :global(.checkbox) {
      font-size: 14px;
    }
  }
  .num {
    display: flex;
    align-items: center;
    justify-content: center;
    font-variant-numeric: tabular-nums;
  }
  .time {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding-right: 2px;
  }
  .time :global(svg) {
    width: 17px;
    height: 17px;
  }
  @container (max-width: 600px) {
    .header {
      grid-template-columns: 28px minmax(0, 1fr) 48px;
      gap: 10px;
      padding: 0 8px;
      margin-right: 10px;
      margin-left: 10px;
    }
    .album {
      display: none;
    }
  }
</style>
