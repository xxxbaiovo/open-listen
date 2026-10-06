<script lang="ts">
  import SearchInput from '@/components/material/SearchInput.svelte'
  import { location, query, push, replace } from '@/plugins/routes'
  import { getSourceId, urlParamKeyMap } from '@/views/Online/shared.svelte'
  import { resourceList } from '@/modules/extension/reactive.svelte'
  import { extT } from '@/modules/extension/i18n'
  import { workers } from '@/worker'
  import { onDestroy, onMount, untrack, type ComponentExports } from 'svelte'
  import { _locale } from '@/plugins/i18n'
  import { useCommands } from '@/modules/command/reactive.svelte'
  import { getLastUsedCommands, setLastUsedCommand } from '@/modules/app/store/action'
  import { toOnlineSearch } from '@/modules/resource/actions'
  import { executeCommand } from '@/modules/command/actions'
  import { commandEvent } from '@/modules/command/event'
  import { showNotify } from '@/components/apis/notify'
  import { setShowPlayDetail } from '@/modules/playDetail/store/action'
  import {
    recentSearches, rememberSearch, rememberSearchTrack, removeRecentSearch, clearRecentSearches,
    type RecentSearch,
  } from '@/modules/resource/search/recent.svelte'

  interface Choice {
    id: string
    title: string
    label?: string
    desc?: string
    picUrl?: string
    icon?: string
    kind: 'recent' | 'command'
    recent?: RecentSearch
    command?: string
  }

  let searchInput = $state<ComponentExports<typeof SearchInput> | null>(null)
  let selectedSourceId = $state('')
  let currentText = $state('')
  let historyFilter = $state('')
  let submitted = $state(false)
  let requestVersion = 0
  let choices: Choice[] = []
  const commands = useCommands()
  const sources = $derived($resourceList.resources.musicSearch ?? [])
  const activeSource = $derived(
    sources.find((source) => getSourceId(source) === selectedSourceId) ??
    sources.find((source) => getSourceId(source) === $recentSearches[0]?.sourceId) ?? sources[0]
  )
  const recentMode = $derived(!currentText.startsWith('>'))
  const zh = $derived($_locale.startsWith('zh'))
  const noSourceText = $derived(zh
    ? '没有可用的歌曲搜索源，请在设置中启用音乐扩展。'
    : 'Enable a music extension in Settings to search for songs.')

  const setChoices = (next: Choice[]) => {
    choices = next
    searchInput?.setList(next)
  }
  const recentChoices = (filter: string): Choice[] => {
    const keyword = filter.toLocaleLowerCase()
    return $recentSearches
      .filter((item) => !keyword || `${item.title} ${item.singer ?? ''} ${item.keyword}`.toLocaleLowerCase().includes(keyword))
      .map((item) => {
        const source = sources.find((source) => getSourceId(source) === item.sourceId)
        return {
          id: item.id,
          kind: 'recent',
          recent: item,
          title: item.title,
          desc: item.kind === 'music'
            ? `${zh ? '歌曲' : 'Song'}${item.singer ? ` · ${item.singer}` : ''}`
            : `${zh ? '搜索' : 'Search'}${source ? ` · ${$extT(source.extensionId, source.name)}` : ''}`,
          picUrl: item.picUrl,
          icon: item.kind === 'music' ? '#icon-music' : '#icon-history-outline',
        }
      })
  }
  const getCommandList = async (command: string) => {
    let available = [...commands.val]
    const lastUsed = getLastUsedCommands()
    if (lastUsed.length) {
      const recent: AnyListen.Extension.Command[] = []
      for (let index = available.length - 1; index >= 0; index--) {
        const item = available[index]
        const recentIndex = lastUsed.indexOf(item.fullCommand)
        if (recentIndex !== -1) {
          available.splice(index, 1)
          recent[recentIndex] = item
        }
      }
      available = recent.filter(Boolean).concat(available)
    }
    return workers.main.searchCommand(available, command)
  }
  const handleInput = (text: string, showAll = false) => {
    currentText = text.trim()
    historyFilter = showAll ? '' : currentText
    submitted = false
    const version = ++requestVersion
    if (recentMode) {
      setChoices(recentChoices(historyFilter))
      return
    }
    setChoices([])
    void getCommandList(currentText.slice(1).trim()).then((list) => {
      if (version !== requestVersion || submitted) return
      setChoices(list.map((item) => ({
        id: `command:${item.fullCommand}`,
        kind: 'command',
        command: item.fullCommand,
        title: item.name,
        desc: item.description,
        label: item.command,
      })))
    }).catch(() => {
      if (version === requestVersion) setChoices([])
    })
  }
  const closeChoices = () => {
    submitted = true
    requestVersion++
    setChoices([])
    searchInput?.close()
  }
  const runCommand = async (command: string) => {
    closeChoices()
    currentText = ''
    searchInput?.setText('')
    try {
      await executeCommand(command)
      setLastUsedCommand(command)
    } catch (error) {
      showNotify(error instanceof Error ? error.message : String(error))
    }
  }
  const submitMusic = async (text: string, sourceId?: string, recent?: RecentSearch) => {
    const source = sourceId ? sources.find((item) => getSourceId(item) === sourceId) : activeSource
    closeChoices()
    if (!source) {
      showNotify(sourceId && sources.length
        ? (zh ? '该记录的搜索源已停用，请启用对应扩展或重新搜索。' : 'This search source is unavailable. Enable its extension or start a new search.')
        : noSourceText)
      return
    }
    selectedSourceId = getSourceId(source)
    currentText = text.trim()
    searchInput?.setText(currentText)
    if (recent?.kind === 'music' && recent.musicId) {
      setShowPlayDetail(false)
      const params = {
        t: 'search', qt: 'music', s: selectedSourceId, q: currentText,
        p: String(recent.page ?? 1), mid: recent.musicId ?? '',
      }
      if ($location.startsWith('/online')) await replace('/online', params)
      else await push('/online', params)
      rememberSearchTrack({ ...recent, musicId: recent.musicId })
    } else {
      await toOnlineSearch(currentText, source)
      rememberSearch(currentText, selectedSourceId)
    }
  }
  const handleSubmit = (text: string) => {
    text = text.trim()
    if (text.startsWith('>')) {
      const name = text.slice(1).trim()
      const command = commands.val.find((item) => item.fullCommand === name || item.command === name)
      if (command) void runCommand(command.fullCommand)
      else handleInput(text)
      return
    }
    if (!text) {
      handleInput('')
      return
    }
    void submitMusic(text)
  }
  const handleListClick = (index: number, id: string) => {
    const choice = choices[index]
    if (choice?.id !== id) return
    if (choice.kind === 'command' && choice.command) void runCommand(choice.command)
    else if (choice.recent) void submitMusic(choice.recent.keyword, choice.recent.sourceId, choice.recent)
  }

  $effect(() => {
    if (!$location.startsWith('/online') || $query[urlParamKeyMap.type] !== 'search') return
    const keyword = $query[urlParamKeyMap.query] ?? ''
    const sourceId = $query[urlParamKeyMap.source]
    const input = searchInput
    untrack(() => {
      currentText = keyword
      if (sourceId) selectedSourceId = sourceId
      input?.setText(keyword)
    })
  })
  $effect(() => {
    const list = recentChoices(historyFilter)
    const input = searchInput
    if (input && !submitted && recentMode) untrack(() => setChoices(list))
  })

  onMount(() => {
    const stopRun = commandEvent.register('run', async () => {
      searchInput?.setText('> ')
      handleInput('>')
      searchInput?.focus()
    })
    const stopFocus = commandEvent.register('focusSearchInput', async () => {
      handleInput(currentText, true)
      searchInput?.focus()
    })
    return () => {
      stopRun()
      stopFocus()
    }
  })
  onDestroy(() => requestVersion++)
</script>

<SearchInput
  --width="100%"
  --max-width="38rem"
  --min-width="0"
  placeholder={zh ? '想播放什么？' : 'What do you want to play?'}
  bind:this={searchInput}
  {recentMode}
  listTitle={zh ? '最近的搜索记录' : 'Recent searches'}
  emptyText={historyFilter
    ? (zh ? '没有匹配的记录，按 Enter 搜索歌曲' : 'No matching history. Press Enter to search.')
    : (zh ? '搜索过的关键词和播放过的搜索结果会显示在这里' : 'Your searches and songs played from results appear here.')}
  clearLabel={zh ? '清空最近的搜索记录' : 'Clear recent searches'}
  removeLabel={zh ? '移除记录' : 'Remove'}
  canClear={$recentSearches.length > 0}
  onclearlist={clearRecentSearches}
  onremovelist={removeRecentSearch}
  onfocus={(text) => handleInput(text, true)}
  oninput={handleInput}
  onsubmit={handleSubmit}
  onlistclick={handleListClick}
/>
