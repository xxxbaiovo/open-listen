<script lang="ts">
  import VirtualizedList from '@/components/base/VirtualizedList.svelte'
  import { useListItemHeight } from '@/modules/app/reactive.svelte'
  import Menu from './Menu.svelte'
  import ListItem from './ListItem.svelte'
  import { musicClick, playMusic } from './action'
  import { playMusicInfo } from '@/modules/player/reactive.svelte'
  import Header from './Header.svelte'
  import type { ListInfo } from '../type'
  import { useSelect } from './useSelect.svelte'
  import { useHotkey } from './useHotkey.svelte'
  import SearchList from './components/SearchList.svelte'
  import DuplicateMusicModal from './components/DuplicateMusicModal/index.svelte'
  import { type ComponentExports, onMount } from 'svelte'
  import Btn from '@/components/base/Btn.svelte'
  import SvgIcon from '@/components/base/SvgIcon.svelte'
  import { t } from '@/plugins/i18n'
  import { push } from '@/plugins/routes'
  import { userListsAll } from '@/modules/musicLibrary/reactive.svelte'
  import { importLocalFile } from '@/components/layout/Aside/MyList/action'
  import ListSortModal from './components/ListSortModal.svelte'
  import { appEvent } from '@/modules/app/store/event'
  import { getListMetaInfo } from '../shared'
  import { startPointerMusicDrag } from '@/shared/musicDrag.svelte'

  let {
    source,
    listinfo,
    list,
    finding = $bindable(),
    duplicate = $bindable(),
    listsort = $bindable(),
    loaded,
    onscroll,
  }: {
    listinfo: ListInfo
    list: AnyListen.Music.MusicInfo[]
    source: AnyListen.Player.SourceType
    finding: boolean
    duplicate: boolean
    listsort: boolean
    loaded: boolean
    onscroll?: (pos: number) => void
  } = $props()

  let virtualizedList = $state<ComponentExports<typeof VirtualizedList<AnyListen.Music.MusicInfo>> | null>(null)

  let playingIndex = $derived(
    $playMusicInfo?.listId == listinfo.id ? list.findIndex((m) => m.id == $playMusicInfo.musicInfo.id) : -1
  )
  let listItemHeight = useListItemHeight(3.5)
  let picwidth = $derived(Math.round(listItemHeight.val * 0.7))
  let picStyle = $derived(`height:${picwidth}px; width:${picwidth}px;`)
  let activeIndex = $state(-1)
  let itv: number | null = null
  let unmounted = false
  const clearIntv = () => {
    if (!itv) return
    clearInterval(itv)
    itv = null
  }

  const scrollToIndex = (idx: number, animate = true) => {
    clearIntv()
    virtualizedList?.scrollToIndex(idx, -100, animate, (end) => {
      if (!end || unmounted) return
      clearIntv()
      activeIndex = idx
      let count = 0
      let curItv = setInterval(() => {
        if (curItv != itv) return
        activeIndex = ++count % 2 ? -1 : idx
        if (count > 2) clearIntv()
      }, 400)
      itv = curItv
    })
  }
  let select = useSelect({
    get list() {
      return list
    },
  })
  useHotkey({
    getListEl() {
      return virtualizedList?.getListEl()
    },
    selectAll() {
      select.override([...list])
    },
  })

  let menu = $state<ComponentExports<typeof Menu> | null>(null)
  $effect(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    list
    select.clearSelect()
  })
  onMount(() => {
    const unsub = appEvent.on('scrollListTo', (listId, musicId) => {
      if (listinfo.id != listId) return
      const idx = list.findIndex((m) => m.id == musicId)
      if (idx < 0) return
      scrollToIndex(idx)
    })
    return () => {
      if (itv) clearInterval(itv)
      unmounted = true
      unsub()
    }
  })
  export const setScrollPosition = (number: number, animate?: boolean) => {
    virtualizedList?.scrollTo(number, animate)
  }
  export const setScrollIndex = (number: number, animate = false) => {
    scrollToIndex(number, animate)
  }
  export const getScrollPosition = () => {
    return virtualizedList?.getScrollTop() ?? 0
  }
</script>

<Header />
{#if list.length}
  <div class="container">
    <VirtualizedList
      {list}
      keyname="id"
      itemheight={listItemHeight.val}
      bind:this={virtualizedList}
      containerclass="my-list"
      {onscroll}
    >
      {#snippet row(item, index)}
        <ListItem
          musicinfo={item}
          listid={listinfo.id}
          {source}
          active={activeIndex == index}
          selected={select.list.includes(item)}
          selectionstart={select.list.includes(item) && !select.list.includes(list[index - 1])}
          selectionend={select.list.includes(item) && !select.list.includes(list[index + 1])}
          {index}
          {picStyle}
          playing={playingIndex == index}
          onpointerdown={(event) => startPointerMusicDrag(event, select.list.includes(item) ? select.list : [item])}
          oncontextmenu={(event) => {
            event.preventDefault()
            event.stopPropagation()
            activeIndex = index
            if (!select.list.includes(item)) select.handleSelect(index)
            menu!.show(
              {
                listId: listinfo.id,
                musicInfo: item,
                selectedList: select.list,
                onRemoveAllSelected() {
                  select.clearSelect()
                },
              },
              { x: event.pageX, y: event.pageY }
            )
          }}
          onclick={(isKey, event) => {
            select.handleSelect(index, event)
            if (!event.shiftKey && !event.ctrlKey && !event.metaKey) {
              void musicClick(list, listinfo.id, item, source, getListMetaInfo(listinfo))
              if (isKey) void playMusic(listinfo.id, list, item, source, getListMetaInfo(listinfo))
            }
          }}
          onplay={() => {
            void playMusic(listinfo.id, list, item, source, getListMetaInfo(listinfo))
          }}
        />
      {/snippet}
    </VirtualizedList>
    <Menu
      bind:this={menu}
      {source}
      type={listinfo.type}
      deviceid={listinfo.type == 'local' ? listinfo.listMeta.deviceId : null}
      onplay={async (musicInfo) => {
        void playMusic(listinfo.id, list, musicInfo, source, getListMetaInfo(listinfo))
      }}
      onhide={() => {
        activeIndex = -1
      }}
      oncancelmulti={() => {
        select.clearSelect()
      }}
    />
  </div>
{:else if loaded}
  <div class="empty-list">
    <SvgIcon name="music" />
    <h2>{$t('ui.empty_list')}</h2>
    <p>{$t('ui.empty_list_description')}</p>
    <div class="empty-actions">
      {#if source === 'local' && ['default', 'general'].includes(listinfo.type)}
        <Btn
          onclick={async () => {
            const target = $userListsAll.find((item) => item.id === listinfo.id)
            if (target) return importLocalFile(target)
          }}>{$t('ui.add_music')}</Btn
        >
      {/if}
      <Btn outline onclick={async () => push('/settings', { type: 'extensions' })}>{$t('ui.extensions')}</Btn>
    </div>
  </div>
{/if}
<SearchList
  bind:visible={finding}
  {list}
  onselect={(idx, isPlay) => {
    if (isPlay) {
      void playMusic(listinfo.id, list, list[idx], source, getListMetaInfo(listinfo))
    } else {
      scrollToIndex(idx)
    }
  }}
/>
<DuplicateMusicModal bind:visible={duplicate} {listinfo} />
<ListSortModal bind:visible={listsort} {listinfo} />

<style lang="less">
  .container {
    flex: auto;
    min-height: 0;
    // padding: 0 5px;
    margin: 0 22px 12px;
    overflow: hidden;
  }
  .empty-list {
    display: flex;
    flex: 1;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    min-height: 150px;
    padding: 24px;
    overflow: auto;
    text-align: center;
  }
  .empty-list > :global(svg) {
    width: 38px;
    height: 38px;
    margin-bottom: 4px;
    color: var(--color-font-label);
  }
  .empty-list h2 {
    font-size: 20px;
    font-weight: 700;
  }
  .empty-list p {
    max-width: 400px;
    font-size: 13px;
    line-height: 1.6;
    color: var(--color-font-label);
  }
  .empty-actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 8px;
    margin-top: 6px;
  }
  .empty-actions :global(.btn) {
    border-radius: 24px;
  }
  @container (max-width: 600px) {
    .container {
      margin: 0 10px 8px;
    }
  }
</style>
