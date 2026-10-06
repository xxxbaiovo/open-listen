<script lang="ts">
  import ListItem from './ListItem.svelte'
  import Menu from './Menu.svelte'
  import { useListItemHeight } from '@/modules/app/reactive.svelte'
  import type { Position } from '@/components/base/Menu.svelte'
  import { getAllList } from '@/modules/musicLibrary/store/actions'
  import { scrollPointerEvents } from '@/shared/compositions/scrollPointerEvents.svelte'
  import { verticalScrollbar } from '@/shared/compositions/verticalScrollbar.svelte'
  import { defaultLists, useUserList } from '@/modules/musicLibrary/reactive.svelte'
  import type { ComponentExports } from 'svelte'
  import { sortable } from '@/shared/compositions/sortable.svelte'
  import { updateUserListPosition } from './action'
  import { t } from '@/plugins/i18n'
  import PlaylistDropZone from './PlaylistDropZone.svelte'
  let { filter = '' }: { filter?: string } = $props()
  // console.log(params)
  const listItemHeight = useListItemHeight(4.2)
  const picStyle = $derived(`height:${listItemHeight.val * 0.64}px; width:${listItemHeight.val * 0.64}px;`)
  // const picStyle = $derived(`height:${listItemHeight.val * 0.5}px;`)

  let menu: ComponentExports<typeof Menu>

  const userLists = useUserList(null)
  const lists = $derived(
    [...$defaultLists, ...userLists.val].filter((item) =>
      item.name.toLocaleLowerCase().includes(filter.trim().toLocaleLowerCase())
    )
  )
  let activeIndex = $state(-1)

  const showMenu = (item: AnyListen.List.MyListInfo | null, position: Position) => {
    menu.show(item, position)
  }
</script>

<div class="list">
  {#await getAllList()}
    <div class="list-container tip">Loading...</div>
  {:then _}
    <div
      class="list-container my-list-container"
      role="list"
      tabindex="-1"
      {@attach scrollPointerEvents}
      {@attach verticalScrollbar({ offset: '0', scrollbarWidth: '0.375rem' })}
      oncontextmenu={(event) => {
        event.preventDefault()
        event.stopPropagation()
        activeIndex = -1
        showMenu(null, { x: event.pageX, y: event.pageY })
      }}
    >
      <ul
        class="list"
        {@attach sortable({
          onupdate: (parentId, id, toTargetId, position) => {
            if (filter.trim()) return
            void updateUserListPosition(id, position - $defaultLists.length)
          },
          filter: filter.trim() ? 'list-item' : 'default-list',
          activeElement: 'my-list-container',
        })}
      >
        {#each lists as item, index (item.id)}
          <li class="list-item draggable-item" class:default-list={item.type == 'default'} data-id={item.id}>
            <ListItem
              listInfo={item}
              active={activeIndex == index}
              {picStyle}
              oncontextmenu={(event) => {
                event.preventDefault()
                event.stopPropagation()
                activeIndex = index
                showMenu(item, { x: event.pageX, y: event.pageY })
              }}
            />
          </li>
        {:else}
          <li class="empty-filter">{$t('ui.no_results')}</li>
        {/each}
      </ul>
      <PlaylistDropZone />
    </div>
  {:catch error}
    <div class="list-container tip">Load failed: {error.message}</div>
  {/await}
</div>
<Menu
  bind:this={menu}
  onhide={() => {
    activeIndex = -1
  }}
/>

<style lang="less">
  .list {
    position: relative;
    min-height: 0;
    flex: 1;
    height: 100%;
  }
  .list-container {
    position: relative;
    display: block;
    // outline: none;
    height: 100%;
    contain: strict;
  }
  .list-container > .list { height: auto; }
  .list-item {
    min-height: 4.2rem;
    padding: 0 6px;
    -webkit-user-drag: revert-layer;
  }
  .tip {
    align-items: center;
    justify-content: center;
  }
  .empty-filter {
    padding: 24px 16px;
    font-size: 13px;
    line-height: 1.6;
    color: var(--color-font-label);
  }
</style>
