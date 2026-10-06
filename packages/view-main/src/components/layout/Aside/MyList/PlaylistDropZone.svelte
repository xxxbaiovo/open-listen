<script lang="ts">
  import SvgIcon from '@/components/base/SvgIcon.svelte'
  import { t } from '@/plugins/i18n'
  import { showListEditModal } from '@/components/apis/listEditModal'
  import { musicDrag } from '@/shared/musicDrag.svelte'
</script>

<button
  type="button"
  class="new-playlist"
  data-music-drop-id="__new__"
  class:dragging={musicDrag.tracks.length > 0}
  class:drop-target={musicDrag.targetId === '__new__' && musicDrag.tracks.length > 0}
  onclick={() => { void showListEditModal(undefined, false, 'general') }}
>
  <span class="icon"><SvgIcon name="plus" /></span>
  <span class="copy"><strong>{$t('ui.new_playlist')}</strong><span>{$t('ui.drop_to_create')}</span></span>
</button>

<style lang="less">
  .new-playlist {
    display: flex;
    align-items: center;
    gap: 12px;
    width: calc(100% - 12px);
    margin: 4px 6px 8px;
    padding: 8px;
    color: var(--color-font-label);
    background: transparent;
    border: 1px solid transparent;
    border-radius: 8px;
    text-align: left;
    cursor: pointer;
    transition: background-color 120ms, border-color 120ms;
  }
  .new-playlist:hover, .dragging { background: var(--color-button-background-hover); }
  .drop-target { border-color: #1ed760; box-shadow: inset 0 0 0 1px #1ed760; color: var(--color-font); }
  .icon { display: grid; place-items: center; flex: none; width: 42px; height: 42px; background: var(--color-surface-raised); border-radius: 4px; }
  .icon :global(svg) { width: 22px; height: 22px; }
  .copy { display: flex; flex-direction: column; gap: 5px; min-width: 0; }
  strong { color: var(--color-font); font-size: 13px; font-weight: 600; }
  .copy > span { font-size: 11px; }
</style>
