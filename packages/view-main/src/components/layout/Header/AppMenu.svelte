<script lang="ts">
  import { tick } from 'svelte'
  import { showListEditModal } from '@/components/apis/listEditModal'
  import { executeLocalCommand } from '@/modules/command/actions'
  import { setShowPlayDetail } from '@/modules/playDetail/store/action'
  import { isShowPlayDetail } from '@/modules/playDetail/reactive.svelte'
  import { musicInfo, playing } from '@/modules/player/reactive.svelte'
  import { skipNext, skipPrev, togglePlay } from '@/modules/player/actions'
  import { useSettingValue } from '@/modules/setting/reactive.svelte'
  import { updateSetting } from '@/modules/setting/store/action'
  import { push } from '@/plugins/routes'
  import { t } from '@/plugins/i18n'

  let opened = $state(false)
  let category = $state<number | null>(null)
  let root = $state<HTMLDivElement>()
  let trigger = $state<HTMLButtonElement>()
  const theme = useSettingValue('theme.id')
  const go = (id: string) => {
    setShowPlayDetail(false)
    void push('/settings', { type: 'app', id })
  }
  const groups = $derived([
    {
      label: $t('ui.menu_file'),
      items: [
        {
          label: $t('user_list_menu__create'),
          action: () => {
            setShowPlayDetail(false)
            void showListEditModal()
          },
        },
        { label: $t('ui.menu_backup'), action: () => go('backup') },
      ],
    },
    {
      label: $t('main.app_menu.edit'),
      items: [
        {
          label: $t('ui.search_music'),
          action: () => {
            setShowPlayDetail(false)
            void executeLocalCommand('focusSearchInput')
          },
        },
        { label: $t('ui.menu_shortcuts'), action: () => go('hotkey') },
        { label: $t('ui.menu_settings'), action: () => go('basic') },
        {
          label: $t('extenstion'),
          action: () => {
            setShowPlayDetail(false)
            void push('/settings', { type: 'extensions' })
          },
        },
      ],
    },
    {
      label: $t('ui.menu_view'),
      items: [
        {
          label: $t('ui.home'),
          action: () => {
            setShowPlayDetail(false)
            void push('/home')
          },
        },
        { label: $t('ui.menu_lyrics'), action: () => setShowPlayDetail(!$isShowPlayDetail) },
        {
          label: $t('ui.mode_dark'),
          selected: theme.val === 'midnight',
          action: () => {
            void updateSetting({ 'theme.id': 'midnight' })
          },
        },
        {
          label: $t('ui.mode_light'),
          selected: theme.val === 'grey',
          action: () => {
            void updateSetting({ 'theme.id': 'grey' })
          },
        },
      ],
    },
    {
      label: $t('ui.menu_playback'),
      items: [
        { label: $playing ? $t('player__pause') : $t('player__play'), disabled: !$musicInfo.id, action: togglePlay },
        { label: $t('ui.menu_previous'), disabled: !$musicInfo.id, action: skipPrev },
        { label: $t('ui.menu_next'), disabled: !$musicInfo.id, action: skipNext },
      ],
    },
    {
      label: $t('ui.menu_help'),
      items: [
        { label: $t('ui.menu_shortcuts'), action: () => go('hotkey') },
        { label: $t('main.app_menu.about_app'), action: () => go('about') },
      ],
    },
  ])

  const close = (restoreFocus = false) => {
    opened = false
    category = null
    if (restoreFocus) trigger?.focus()
  }
  const open = async () => {
    opened = true
    category = null
    await tick()
    root?.querySelector<HTMLButtonElement>('[role="menuitem"]')?.focus()
  }
  const expand = async (index: number, focus = false) => {
    category = index
    if (focus) {
      await tick()
      root?.querySelector<HTMLButtonElement>('.submenu [role^="menuitem"]')?.focus()
    }
  }
  const onKeydown = (event: KeyboardEvent) => {
    if (!opened) return
    event.stopPropagation()
    if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      close(true)
      return
    }
    if (event.key === 'Tab') {
      close(true)
      return
    }
    const target = event.target as HTMLElement
    const panel = target.closest('[role="menu"]')
    if (!panel) return
    const items = [...panel.querySelectorAll<HTMLButtonElement>(':scope > button:not(:disabled)')]
    const current = items.indexOf(target as HTMLButtonElement)
    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault()
      const next =
        event.key === 'Home'
          ? 0
          : event.key === 'End'
            ? items.length - 1
            : (current + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length
      items[next]?.focus()
    } else if (event.key === 'ArrowRight' && target.dataset.category) {
      event.preventDefault()
      void expand(Number(target.dataset.category) - 1, true)
    } else if (event.key === 'ArrowLeft' && category !== null) {
      event.preventDefault()
      root?.querySelector<HTMLButtonElement>(`[data-category="${category + 1}"]`)?.focus()
      category = null
    }
  }
</script>

<svelte:window
  onpointerdown={(event) => {
    if (opened && event.target instanceof Node && !root?.contains(event.target)) close()
  }}
/>
<div class="app-menu" bind:this={root} onkeydown={onKeydown} role="toolbar" tabindex="-1" aria-label={$t('ui.app_menu')}>
  <button
    bind:this={trigger}
    class="trigger"
    aria-label={$t('ui.app_menu')}
    title={$t('ui.app_menu')}
    aria-haspopup="menu"
    aria-expanded={opened}
    onclick={() => {
      if (opened) close()
      else void open()
    }}
    onkeydown={(event) => {
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        void open()
      }
    }}
  >
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"
      ><circle cx="4" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="20" cy="12" r="2" /></svg
    >
  </button>
  {#if opened}
    <div class="menu-panels">
      <div class="menu" role="menu" aria-label={$t('ui.app_menu')}>
        {#each groups as group, index (index)}
          <button
            role="menuitem"
            data-category={index + 1}
            aria-haspopup="menu"
            aria-expanded={category === index}
            class:active={category === index}
            onclick={async () => expand(index, true)}
            onpointerenter={(event) => {
              if (event.pointerType === 'mouse') void expand(index)
            }}
          >
            <span>{group.label}</span><span aria-hidden="true">›</span>
          </button>
        {/each}
      </div>
      {#if category !== null}
        <div class="menu submenu" role="menu" aria-label={groups[category].label}>
          {#each groups[category].items as item (item.label)}
            <button
              role={'selected' in item ? 'menuitemradio' : 'menuitem'}
              aria-checked={'selected' in item ? item.selected : undefined}
              disabled={'disabled' in item && item.disabled}
              onclick={() => {
                close(true)
                item.action()
              }}
            >
              <span>{item.label}</span>{#if 'selected' in item && item.selected}<span aria-hidden="true">✓</span>{/if}
            </button>
          {/each}
        </div>
      {/if}
    </div>
  {/if}
</div>

<style lang="less">
  .app-menu {
    position: relative;
    flex: none;
  }
  button {
    color: var(--color-font);
    border: 0;
    cursor: pointer;
    background: transparent;
  }
  .trigger {
    display: grid;
    place-items: center;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    color: var(--color-font-label);
  }
  .trigger:hover,
  .trigger[aria-expanded='true'] {
    color: var(--color-font);
    background: var(--color-button-background-hover);
  }
  .menu-panels {
    position: absolute;
    top: 46px;
    left: 0;
    display: flex;
    align-items: flex-start;
    gap: 4px;
  }
  .menu {
    width: 160px;
    padding: 6px;
    border-radius: 8px;
    background: var(--color-surface-raised, var(--color-content-background));
    box-shadow: 0 8px 24px #0005;
    border: 1px solid var(--color-border, #ffffff14);
  }
  .submenu {
    width: 196px;
  }
  .menu button {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    width: 100%;
    min-height: 40px;
    padding: 8px 12px;
    text-align: left;
    border-radius: 4px;
    font-size: 14px;
    line-height: 1.4;
  }
  .menu button:hover,
  .menu button:focus-visible,
  .menu button.active {
    background: var(--color-button-background-hover);
  }
  .menu button:disabled {
    opacity: 0.4;
    cursor: default;
  }
  @media (max-width: 600px) {
    .menu {
      width: 120px;
    }
    .submenu {
      width: min(176px, calc(100vw - 144px));
    }
    .menu button {
      padding-inline: 8px;
    }
  }
</style>
