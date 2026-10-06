<script lang="ts">
  import { type Snippet, tick, onDestroy } from 'svelte'
  import type { MouseEventHandler } from 'svelte/elements'
  import { t } from '@/plugins/i18n'

  let {
    placeholder = 'Search for something...',
    oninput,
    onfocus,
    onsubmit,
    onbackbtnclick,
    onlistclick,
    oncontextmenu,
    small,
    big,
    searchicon,
    recentMode = false,
    listTitle = '',
    emptyText = '',
    clearLabel = '',
    removeLabel = '',
    canClear = false,
    onclearlist,
    onremovelist,
  }: {
    placeholder?: string
    onbackbtnclick?: () => void
    oninput?: (text: string) => void
    onfocus?: (text: string) => void
    onsubmit: (text: string) => void
    onlistclick?: (index: number, id: string) => void
    oncontextmenu?: MouseEventHandler<HTMLInputElement>
    small?: boolean
    big?: boolean
    searchicon?: Snippet
    recentMode?: boolean
    listTitle?: string
    emptyText?: string
    clearLabel?: string
    removeLabel?: string
    canClear?: boolean
    onclearlist?: () => void
    onremovelist?: (id: string) => void
  } = $props()

  interface ListItem {
    id: string
    title: string
    label?: string
    desc?: string
    picUrl?: string
    icon?: string
  }

  let domInput = $state<HTMLInputElement | null>(null)
  let domList = $state<HTMLDivElement | null>(null)
  let text = $state('')
  let isActive = $state(false)
  let selectIndex = $state(-1)
  let list = $state<ListItem[]>([])
  let listStyle = $state('height: 0')
  let isFocus = false
  let isShowList = false
  let maxHeight = '0'
  let blurTimer: ReturnType<typeof setTimeout> | undefined
  let listVersion = 0

  onDestroy(() => clearTimeout(blurTimer))

  const showList = () => {
    if (!list.length && !recentMode) return
    isShowList = true
    isActive = true
    maxHeight = `${document.body.clientHeight * 0.6}px`
    void tick().then(() => {
      if (isShowList) listStyle = `height: ${domList?.scrollHeight ?? 0}px; max-height: ${maxHeight};`
    })
  }
  const hideList = () => {
    listVersion++
    isShowList = false
    listStyle = `height: 0; max-height: ${maxHeight};`
    selectIndex = -1
    isActive = false
  }
  const handleSearch = () => {
    const selected = list[selectIndex]
    const index = selectIndex
    hideList()
    if (!selected) {
      onsubmit(text.trim())
      return
    }
    onlistclick?.(index, selected.id)
  }
  const selectItem = (index: number, id: string) => {
    hideList()
    onlistclick?.(index, id)
  }
  const handleKeyDown = () => {
    if (list.length) {
      selectIndex = selectIndex + 1 < list.length ? selectIndex + 1 : 0
    } else if (selectIndex > -1) {
      selectIndex = -1
    }
    scrollSelected()
  }
  const handleKeyUp = () => {
    if (list.length) {
      selectIndex = selectIndex - 1 < -1 ? list.length - 1 : selectIndex - 1
    } else if (selectIndex > -1) {
      selectIndex = -1
    }
    scrollSelected()
  }
  const scrollSelected = () => {
    void tick().then(() => {
      domList?.querySelector(`[data-index="${selectIndex}"]`)?.scrollIntoView({ block: 'nearest' })
    })
  }
  // const handleContextMenu = () => {
  //   let str = clipboardReadText()
  //   str = str.trim()
  //   str = str.replace(/\t|\r\n|\n|\r/g, ' ')
  //   str = str.replace(/\s+/g, ' ')
  //   if (domInput) {
  //     text = text.substring(0, domInput.selectionStart) + str + text.substring(domInput.selectionEnd, text.length)
  //   }
  // }
  const handleClearList = () => {
    text = ''
    oninput?.(text)
    domInput?.focus()
  }

  export const focus = () => {
    domInput?.focus()
  }
  export const close = hideList
  export const setText = (_text: string) => {
    text = _text
  }
  export const setList = (_list: ListItem[]) => {
    const version = ++listVersion
    list = _list
    if (!list.length && !recentMode) {
      hideList()
      return
    }
    if (!isFocus && !domList?.contains(document.activeElement)) return
    if (selectIndex > -1) selectIndex = -1
    void tick().then(() => {
      if (version !== listVersion) return
      if (!isFocus && !domList?.contains(document.activeElement)) return
      if (isShowList) {
        listStyle = `height: ${domList?.scrollHeight ?? 0}px; max-height: ${document.body.clientHeight * 0.6}px;`
      } else if (list.length || recentMode) {
        showList()
      }
    })
  }
</script>

<div class="search-input no-drag">
  <div class={['content', { active: isActive, small, big }]}>
    <div class="form">
      {#if onbackbtnclick}
        <button type="button" aria-label={$t('btn_back')} onclick={onbackbtnclick}>
          <svg height="100%" viewBox="0 0 24 24">
            <use xlink:href="#icon-back" />
          </svg>
        </button>
      {/if}
      <input
        bind:this={domInput}
        bind:value={text}
        {placeholder}
        aria-label={placeholder}
        autocomplete="off"
        spellcheck="false"
        onclick={() => {
          if (isShowList) return
          onfocus?.(text)
          showList()
        }}
        onfocus={() => {
          clearTimeout(blurTimer)
          isFocus = true
          onfocus?.(text)
          showList()
        }}
        onblur={() => {
          isFocus = false
          clearTimeout(blurTimer)
          blurTimer = setTimeout(() => {
            if (!domList?.contains(document.activeElement)) hideList()
          }, 80)
        }}
        oninput={(evt) => {
          text = (evt.target as HTMLInputElement).value
          oninput?.(text)
        }}
        onkeydown={(event) => {
          if (event.isComposing) return
          switch (event.key) {
            case 'Enter':
              event.preventDefault()
              event.stopPropagation()
              handleSearch()
              break
            case 'ArrowDown':
              event.preventDefault()
              event.stopPropagation()
              showList()
              handleKeyDown()
              break
            case 'ArrowUp':
              event.preventDefault()
              event.stopPropagation()
              showList()
              handleKeyUp()
              break
            case 'Escape':
              event.preventDefault()
              event.stopPropagation()
              hideList()
              break
          }
        }}
        {oncontextmenu}
      />
      {#if text}
        <button type="button" aria-label={$t('btn_clear')} onclick={handleClearList}>
          <svg height="100%" viewBox="0 0 24 24">
            <use xlink:href="#icon-window-close" />
          </svg>
        </button>
      {/if}
      <button type="button" class="search-submit" aria-label={$t('btn_submit')} onclick={handleSearch}>
        {#if searchicon}
          {@render searchicon()}
        {:else}
          <svg height="100%" viewBox="0 0 24 24">
            <use xlink:href="#icon-search" />
          </svg>
        {/if}
      </button>
    </div>
    <div class="list-content scroll" class:recent={recentMode} style={listStyle} hidden={!isActive}>
      <div
        bind:this={domList}
        role="group"
        aria-label={listTitle || placeholder}
        class="list"
        onfocusout={(event) => {
          const next = event.relatedTarget as Node | null
          if (next !== domInput && !domList?.contains(next)) hideList()
        }}
        onmouseleave={() => {
          selectIndex = -1
        }}
      >
        {#if recentMode}
          <h2 class="recent-title">{listTitle}</h2>
          {#if !list.length}
            <p class="recent-empty">{emptyText}</p>
          {/if}
          {#each list as item, index (item.id)}
            <div class="recent-row" class:select={selectIndex === index} data-index={index}>
              <button
                type="button"
                class="recent-result"
                onmouseenter={() => (selectIndex = index)}
                onfocus={() => (selectIndex = index)}
                onkeydown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') event.stopPropagation()
                  if (event.key === 'Escape') {
                    event.stopPropagation()
                    domInput?.focus()
                    hideList()
                  }
                }}
                onclick={() => selectItem(index, item.id)}
              >
                <span class="recent-art">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><use href={item.icon || '#icon-history-outline'} /></svg>
                  {#if item.picUrl}
                    <img src={item.picUrl} alt="" loading="lazy" onerror={(event) => (event.currentTarget.hidden = true)} />
                  {/if}
                </span>
                <span class="recent-copy">
                  <span class="recent-name">{item.title}</span>
                  {#if item.desc}<span class="recent-desc">{item.desc}</span>{/if}
                </span>
              </button>
              <button
                type="button"
                class="recent-remove"
                aria-label={`${removeLabel} ${item.title}`}
                onclick={() => {
                  onremovelist?.(item.id)
                  domInput?.focus()
                }}
              ><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#icon-window-close" /></svg></button>
            </div>
          {/each}
          {#if canClear}
            <div class="recent-footer">
              <button type="button" class="recent-clear" onclick={() => {
                onclearlist?.()
                domInput?.focus()
              }}>{clearLabel}</button>
            </div>
          {/if}
        {:else}
        {#each list as item, index (index)}
          <div
            role="button"
            class="list-item"
            data-index={index}
            tabindex="0"
            aria-label={item.title}
            onblur={(event) => {
              const next = event.relatedTarget as Node | null
              if (next !== domInput && !domList?.contains(next)) hideList()
            }}
            onkeydown={(evt) => {
              if (evt.key === 'Enter' || evt.key === ' ') {
                evt.preventDefault()
                evt.stopPropagation()
                selectItem(index, item.id)
              }
            }}
            class:select={selectIndex === index}
            onmouseenter={() => {
              selectIndex = index
            }}
            onclick={(evt) => {
              evt.stopPropagation()
              selectItem(index, item.id)
            }}
          >
            {#if item.label}
              <div class="list-item-label-title">
                <p class="list-item-title">{item.title}</p>
                <p class="list-item-label">{item.label}</p>
              </div>
            {:else}
              <p class="list-item-title">
                {item.title}
              </p>
            {/if}
            {#if item.desc}
              <p class="list-item-desc">{item.desc}</p>
            {/if}
          </div>
        {/each}
        {/if}
      </div>
    </div>
  </div>
</div>

<style lang="less">
  .recent .list {
    padding: 20px 12px 12px;
  }
  .recent-title {
    margin: 0 12px 14px;
    color: var(--color-font);
    font-size: 18px;
    font-weight: 750;
    line-height: 1.4;
    letter-spacing: -0.025em;
  }
  .recent-empty {
    padding: 4px 12px 18px;
    color: var(--color-font-label);
    font-size: 13px;
    line-height: 1.6;
  }
  .recent-row {
    display: flex;
    align-items: center;
    gap: 4px;
    border-radius: 8px;
    transition: background-color 120ms;
    &:hover, &.select, &:focus-within {
      background: var(--color-button-background-hover);
    }
  }
  .recent-result {
    display: flex;
    flex: 1;
    align-items: center;
    gap: 14px;
    min-width: 0;
    padding: 10px 12px;
    color: var(--color-font);
    text-align: left;
    background: transparent;
    border: 0;
    border-radius: 8px;
    cursor: pointer;
  }
  .recent-art {
    position: relative;
    display: grid;
    flex: none;
    place-items: center;
    width: 52px;
    height: 52px;
    overflow: hidden;
    color: var(--color-font-label);
    background: var(--color-button-background-hover);
    border-radius: 4px;
    svg { width: 23px; height: 23px; }
    img {
      position: absolute;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }
  .recent-copy { display: flex; flex-direction: column; gap: 5px; min-width: 0; }
  .recent-name, .recent-desc { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .recent-name { font-size: 15px; font-weight: 600; line-height: 1.4; }
  .recent-desc { color: var(--color-font-label); font-size: 13px; line-height: 1.35; }
  .recent-remove {
    display: grid;
    flex: none;
    place-items: center;
    width: 32px;
    height: 32px;
    margin-right: 8px;
    padding: 8px;
    color: var(--color-font-label);
    background: transparent;
    border: 0;
    border-radius: 50%;
    cursor: pointer;
    opacity: 0;
    transition: opacity 120ms, color 120ms;
    svg { width: 16px; height: 16px; }
    &:hover { color: var(--color-font); background: var(--color-button-background-hover); }
  }
  .recent-row:hover .recent-remove, .recent-row:focus-within .recent-remove { opacity: 1; }
  .recent-footer { padding: 12px 12px 6px; }
  .recent-clear {
    min-height: 34px;
    padding: 6px 17px;
    color: var(--color-font);
    background: transparent;
    border: 1px solid var(--color-font-label);
    border-radius: 20px;
    font-size: 13px;
    font-weight: 650;
    line-height: 1.5;
    cursor: pointer;
    transition: background-color 120ms;
    &:hover { background: var(--color-button-background-hover); }
    &:active { scale: 0.96; }
  }
  @media (hover: none) { .recent-remove { opacity: 1; } }
  @input-height: @height-toolbar * 0.6;
  .search-input {
    position: relative;
    width: var(--width, 35%);
    min-width: var(--min-width, none);
    max-width: var(--max-width, none);
    height: @input-height;
  }
  .content {
    position: absolute;
    display: flex;
    flex-flow: column nowrap;
    width: 100%;
    background-color: var(--color-primary-light-300-alpha-700);
    border-radius: @form-radius;
    transition: background-color @transition-fast;

    &.active {
      background-color: var(--color-primary-light-600-alpha-100);
    }
    .form {
      position: relative;
      display: flex;
      height: @input-height;
      input {
        flex: auto;
        min-width: 0;
        // height: @height-toolbar * .7;
        padding: 0 5px;
        overflow: hidden;
        font-size: 13.5px;
        // line-height: @input-height + 5px;
        outline: none;
        background-color: transparent;
        // border-bottom: 2px solid var(--color-primary);
        // border-color: var(--color-primary);
        border: none;
        // border: 1px solid;
        border-top-left-radius: 3px;
        border-bottom-left-radius: 3px;
        &::placeholder {
          font-size: 0.98em;
          color: var(--color-button-font);
        }
      }
      button {
        display: flex;
        flex: none;
        height: 100%;
        padding: 6px 7px;
        color: var(--color-button-font);
        cursor: pointer;
        outline: none;
        // background-color: @color-search-form-background;
        background-color: transparent;
        border: none;
        transition: background-color 0.2s ease;

        &:last-child {
          border-top-right-radius: 3px;
          border-bottom-right-radius: 3px;
        }

        &:hover {
          background-color: var(--color-button-background-hover);
        }
        &:active {
          background-color: var(--color-button-background-active);
        }
      }
    }
    .list-content {
      position: absolute;
      top: calc(100% + 8px);
      right: 0;
      left: 0;
      height: 0;
      max-height: 300px;
      overflow: auto;
      background: var(--color-surface-raised, var(--color-content-background));
      border-radius: 12px;
      box-shadow: 0 12px 30px #0005;
      font-size: 13px;
      .list-item {
        max-width: 100%;
        padding: 8px 5px;
        line-height: 1.3;
        cursor: pointer;
        transition: background-color 0.3s ease;
        .list-item-title {
          .mixin-ellipsis-1();
        }
        .list-item-label-title {
          display: flex;
          justify-content: space-between;
          max-width: 100%;
          .list-item-title {
            flex: none;
            max-width: 100%;
          }
          .list-item-label {
            .mixin-ellipsis-1();

            flex-grow: 0;
            flex-shrink: 1;
            margin-left: 10px;
            font-size: 0.9em;
            color: var(--color-600);
          }
        }

        .list-item-desc {
          font-size: 0.9em;
          color: var(--color-600);
          .mixin-ellipsis-2();
        }

        &.select {
          background-color: var(--color-primary-dark-100-alpha-700);
        }
        &:last-child {
          border-bottom-right-radius: 3px;
          border-bottom-left-radius: 3px;
        }
      }
    }
  }

  .big {
    width: 100%;
    // input {
    //   line-height: 30px;
    // }
    .form {
      height: 30px;
      button {
        padding: 6px 10px;
      }
    }
  }
</style>
