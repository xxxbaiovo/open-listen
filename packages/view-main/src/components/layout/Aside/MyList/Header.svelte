<script lang="ts">
  import { t } from '@/plugins/i18n'
  import SvgIcon from '@/components/base/SvgIcon.svelte'
  import { showListEditModal } from '@/components/apis/listEditModal'
  import ListTypeSelect from '@/components/apis/listEditModal/ListTypeSelect.svelte'
  import { tick } from 'svelte'
  let { filter = $bindable('') }: { filter?: string } = $props()
  const menuId = $props.id()
  let opened = $state(false)
  let trigger = $state<HTMLButtonElement>()
  let menu = $state<HTMLDivElement>()
  let menuLeft = $state(0)
  let menuTop = $state(0)
  let searching = $state(false)
  let filterInput = $state<HTMLInputElement>()
  let searchTrigger = $state<HTMLButtonElement>()
  const toggleSearch = async () => {
    searching = !searching
    if (!searching) filter = ''
    await tick()
    if (searching) filterInput?.focus()
    else searchTrigger?.focus()
  }
  const closeMenu = () => {
    menu?.hidePopover()
    opened = false
  }
  const openMenu = async () => {
    if (!trigger || !menu) return
    const rect = trigger.getBoundingClientRect()
    const width = Math.min(376, window.innerWidth - 24)
    menuLeft = Math.max(12, Math.min(rect.left, window.innerWidth - width - 12))
    menuTop = rect.bottom + 8
    menu.showPopover()
    opened = true
    await tick()
    menuTop = Math.max(12, Math.min(menuTop, window.innerHeight - menu.offsetHeight - 12))
    menu.querySelector<HTMLButtonElement>('button')?.focus()
  }
</script>

<svelte:window onresize={closeMenu} />

<div class="library-header">
  <h2>{$t('ui.library')}</h2>
  <button class="create" bind:this={searchTrigger} aria-label={$t('ui.search_library')}
    title={$t('ui.search_library')} aria-expanded={searching} onclick={toggleSearch}>
    <SvgIcon name="search" />
  </button>
  <button
    class="create"
    class:opened
    bind:this={trigger}
    onclick={() => {
      if (opened) closeMenu()
      else void openMenu()
    }}
    onkeydown={(event) => {
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        void openMenu()
      }
    }}
    aria-haspopup="menu"
    aria-expanded={opened}
    aria-controls={menuId}
    aria-label={opened ? $t('btn_close') : $t('user_list_menu__create')}
    title={$t('user_list_menu__create')}><SvgIcon name="plus" /></button
  >
</div>
{#if searching}
  <label class="filter">
    <SvgIcon name="search" /><input bind:this={filterInput} type="search" bind:value={filter}
      placeholder={$t('ui.search_library')} aria-label={$t('ui.search_library')}
      onkeydown={(event) => {
        if (event.key === 'Escape') { event.stopPropagation(); void toggleSearch() }
      }} />
  </label>
{/if}

<div
  class="create-menu"
  id={menuId}
  bind:this={menu}
  popover="auto"
  style:left={`${menuLeft}px`}
  style:top={`${menuTop}px`}
  ontoggle={(event) => {
    opened = event.currentTarget.matches(':popover-open')
  }}
  onkeydown={(event) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      closeMenu()
      trigger?.focus()
    } else if (event.key === 'Tab') {
      closeMenu()
      trigger?.focus()
    }
  }}
  role="presentation"
>
  <ListTypeSelect
    onselect={(type) => {
      closeMenu()
      trigger?.focus()
      void showListEditModal(undefined, false, type)
    }}
  />
</div>

<style lang="less">
  .library-header {
    display: flex;
    flex: none;
    align-items: center;
    gap: 8px;
    padding: 4px 12px 12px 20px;
  }
  h2 { flex: 1; min-width: 0; font-size: 16px; font-weight: 700; line-height: 24px; }
  .filter {
    display: flex;
    flex: none;
    align-items: center;
    gap: 8px;
    min-width: 0;
    padding: 0 10px;
    margin: 0 14px 10px;
    background: var(--color-surface-raised, var(--color-button-background));
    color: var(--color-font-label);
    border-radius: 6px;
    transition:
      background-color 150ms,
      color 150ms;
  }
  .filter:hover,
  .filter:focus-within {
    color: var(--color-font);
    background: var(--color-surface-raised, var(--color-button-background));
  }
  .filter :global(svg) {
    width: 17px;
    height: 17px;
    flex: none;
  }
  input {
    width: 100%;
    min-width: 0;
    padding: 10px 0;
    font: inherit;
    font-size: 13px;
    color: var(--color-font);
    background: transparent;
    border: none;
  }
  input::placeholder {
    color: var(--color-font-label);
  }
  .create {
    display: grid;
    flex: none;
    place-items: center;
    width: 34px;
    height: 34px;
    padding: 8px;
    color: var(--color-font-label);
    cursor: pointer;
    background: transparent;
    border: 0;
    border-radius: 50%;
    transition:
      background-color 150ms,
      color 150ms;
  }
  .create:hover {
    color: var(--color-font);
    background: var(--color-button-background-hover);
  }
  .create.opened {
    color: var(--color-font);
    background: var(--color-button-background-hover);
  }
  .create.opened :global(svg) {
    transform: rotate(45deg);
  }
  .create-menu {
    position: fixed;
    inset: auto;
    width: min(376px, calc(100vw - 24px));
    max-height: calc(100vh - 24px);
    padding: 0;
    margin: 0;
    overflow: auto;
    color: var(--color-font);
    background: var(--color-surface-raised, var(--color-content-background));
    border: 0;
    border-radius: 14px;
    box-shadow:
      0 8px 24px #0003,
      0 24px 64px #0004;
  }
  .create-menu::backdrop {
    background: transparent;
  }
  .create :global(svg) {
    width: 18px;
    height: 18px;
  }
  @media (max-width: 700px) {
    input {
      font-size: 16px;
    }
  }
</style>
