<script lang="ts">
  import Empty from '@/components/material/Empty.svelte'
  import MusicList from '@/components/common/MusicList/MusicList.svelte'
  import Pagination from '@/components/material/Pagination.svelte'
  import { buildRequestKey, prefetchPage, search } from '@/modules/resource/search/music/actions'
  import { query, getLocation } from '@/plugins/routes'
  import { t } from '@/plugins/i18n'
  import { urlParamKeyMap, type SourceType } from '../../shared.svelte'
  import { tick, untrack, type ComponentExports } from 'svelte'
  import { pushRoute, replaceRoute } from '@/modules/resource/actions'

  let { source }: { source?: SourceType } = $props()
  let list = $state.raw<AnyListen.Music.MusicInfoOnline[]>([])
  let listInfo = $state({
    total: 0,
    page: 1,
    limit: 20,
    loading: false,
    error: false,
    id: 'search'
  })
  let musicList = $state<ComponentExports<typeof MusicList> | null>(null)
  let displayedSource = $state({ extId: '', source: '' })
  let requestParams: [number, string] = [1, '']
  let requestSequence = 0
  let activeQuery = ''
  let prefetchTimer: ReturnType<typeof setTimeout> | undefined

  const cancelPrefetch = () => {
    clearTimeout(prefetchTimer)
    prefetchTimer = undefined
  }

  const handleSearch = (page: number, text: string, force = false) => {
    if (!source) return
    const sequence = ++requestSequence
    cancelPrefetch()
    const extId = source.extensionId
    const sourceId = source.id
    const requestedLimit = listInfo.limit
    const searchId = buildRequestKey(extId, sourceId, page, requestedLimit, text)
    const queryId = buildRequestKey(extId, sourceId, 0, requestedLimit, text)
    const sameQuery = activeQuery === queryId
    activeQuery = queryId
    requestParams = [page, text]
    listInfo.page = page
    listInfo.error = false

    const request = search(extId, sourceId, text, '', page, requestedLimit, { force })
    listInfo.total = request.total || (sameQuery ? listInfo.total : 0)
    listInfo.loading = !request.result

    const applyResult = (result: AnyListen.IPCResource.MusicListResult) => {
      if (sequence !== requestSequence) return
      listInfo.total = result.total
      listInfo.limit = result.limit
      listInfo.page = result.page
      listInfo.id = searchId
      listInfo.error = false
      list = result.list
      displayedSource = { extId, source: sourceId }

      const location = getLocation()
      const { mid, ...params } = location.query
      if (mid) {
        void tick().then(() => {
          if (sequence !== requestSequence || getLocation().rawLocation !== location.rawLocation) return
          const index = result.list.findIndex((music) => music.id === mid)
          if (index !== -1) musicList?.setScrollIndex(index, false)
          replaceRoute(location.location, params)
        })
      }
      if (text.trim() && result.list.length && result.page * result.limit < result.total) {
        prefetchTimer = setTimeout(() => {
          prefetchTimer = undefined
          if (sequence !== requestSequence) return
          prefetchPage(extId, sourceId, text, '', result.page + 1, result.limit)
        }, 180)
      }
    }

    if (request.result) {
      applyResult(request.result)
      return
    }
    void request.promise
      .then(applyResult)
      .catch((error: unknown) => {
        if (sequence !== requestSequence) return
        console.error(error)
        listInfo.error = true
        list = []
      })
      .finally(() => {
        if (sequence === requestSequence) listInfo.loading = false
      })
  }

  $effect(() => {
    const currentSource = source
    const text = $query[urlParamKeyMap.query] || ''
    const requestedPage = Number.parseInt($query[urlParamKeyMap.page] || '1', 10)
    const page = Number.isFinite(requestedPage) ? Math.max(1, requestedPage) : 1
    untrack(() => {
      if (currentSource) handleSearch(page, text)
    })
    return () => {
      requestSequence++
      cancelPrefetch()
    }
  })
</script>

<div class="music-list">
  {#if source}
    <div class="result-area" aria-busy={listInfo.loading}>
      <div
        class="result-body"
        class:pending={listInfo.loading && list.length > 0}
        inert={listInfo.loading && list.length > 0}
      >
        <MusicList
          bind:this={musicList}
          {list}
          miniheader
          loading={listInfo.loading && list.length === 0}
          error={listInfo.error}
          source="search"
          listinfo={{
            id: listInfo.id,
            name: 'search',
            type: 'online',
            listMeta: {
              extensionId: displayedSource.extId,
              source: displayedSource.source
            }
            // TODO: save list
          }}
          onreload={() => {
            handleSearch(...requestParams, true)
          }}
        />
      </div>
      {#if listInfo.loading && list.length > 0}
        <div class="pending-bar"></div>
        <p class="pending-note" role="status">{$t('list_loading')}</p>
      {/if}
    </div>
    <div class="pagination">
      <Pagination
        count={listInfo.total}
        page={listInfo.page}
        limit={listInfo.limit}
        onclick={(page) => {
          const loc = getLocation()
          pushRoute(loc.location, {
            ...loc.query,
            [urlParamKeyMap.page]: page
          })
        }}
      />
    </div>
  {:else}
    <Empty />
  {/if}
</div>

<style lang="less">
  .music-list {
    display: flex;
    flex: auto;
    flex-flow: column nowrap;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
  }
  .result-body :global(> .container > .header) {
    align-items: center;
    gap: 12px;
    min-height: 46px;
    padding: 0 16px 8px;
  }
  .result-body :global(> .container > .header > .btns) {
    align-items: center;
    gap: 8px;
  }
  .result-body :global(> .container > .header > .btns:first-child > .btn) {
    min-height: 34px;
    padding: 8px 13px;
    border: 0;
    border-radius: 18px;
    font-size: 12px;
    font-weight: 600;
  }
  .result-body :global(> .container > .header > .btns:first-child > .btn:first-child) {
    color: var(--color-accent-on, #111);
    background: var(--color-primary);
  }
  .result-body :global(> .container > .header > .btns:first-child > .btn:not(:first-child)) {
    color: var(--color-font-label);
    background: transparent;
  }
  .result-body :global(> .container > .header > .btns:first-child > .btn:not(:first-child):hover) {
    color: var(--color-font);
    background: var(--color-button-background-hover);
  }
  .result-body :global(> .container > .header > .btns:last-child > .btn) {
    width: 32px;
    height: 32px;
    padding: 8px;
    color: var(--color-font-label);
    border: 0;
    border-radius: 50%;
  }
  .result-body :global(> .container > .header > .btns:last-child > .btn:not(.outline)) {
    color: var(--color-primary);
    background: var(--color-surface-raised, var(--color-button-background-hover));
  }
  .result-body :global(> .container > .header svg) {
    width: 16px;
    height: 16px;
  }
  .result-area,
  .result-body {
    display: flex;
    flex: 1;
    min-width: 0;
    min-height: 0;
  }
  .result-area {
    position: relative;
  }
  .result-body.pending {
    opacity: 0.65;
  }
  .pending-bar {
    position: absolute;
    top: 0;
    right: 12px;
    left: 12px;
    height: 2px;
    background: var(--color-primary);
    border-radius: 2px;
    pointer-events: none;
  }
  .pending-note {
    position: absolute;
    right: 16px;
    bottom: 12px;
    padding: 6px 10px;
    color: var(--color-font-label);
    background: var(--color-surface-raised, var(--color-content-background));
    border-radius: 6px;
    font-size: 12px;
    pointer-events: none;
  }
  .pagination {
    display: flex;
    justify-content: center;
    padding: 8px 12px;
  }
  @container online-view (max-width: 650px) {
    .result-body :global(> .container > .header) {
      flex-wrap: wrap;
      gap: 6px;
      padding: 0 12px 6px;
    }
    .result-body :global(> .container > .header > .btns) {
      gap: 4px;
    }
    .result-body :global(> .container > .header > .btns:last-child) {
      margin-left: auto;
    }
    .result-body :global(> .container > .header > .btns:first-child > .btn) {
      padding-inline: 10px;
    }
  }
</style>
