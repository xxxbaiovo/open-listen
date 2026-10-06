<script lang="ts">
  import { t } from '@/plugins/i18n'
  import { listCreationCopy, type CreatableListType } from './copy'

  let { onselect }: { onselect: (type: CreatableListType) => void } = $props()
  const types: CreatableListType[] = ['general', 'local', 'remote']

  const handleKeydown = (event: KeyboardEvent) => {
    const items = [...(event.currentTarget as HTMLElement).querySelectorAll<HTMLButtonElement>('button')]
    const index = items.indexOf(event.target as HTMLButtonElement)
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    const next =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? items.length - 1
          : (index + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length
    items[next]?.focus()
  }
</script>

<div class="list-types" role="menu" tabindex="-1" aria-label={$t('user_list_menu__create')} onkeydown={handleKeydown}>
  {#each types as type (type)}
    <button type="button" role="menuitem" class="type-option" onclick={() => onselect(type)}>
      <span class="type-icon">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          {#if type === 'general'}
            <path d="M10 18V7l10-2v11M10 10l10-2M5 3v6M2 6h6" />
            <ellipse cx="7" cy="18" rx="3" ry="2.5" />
            <ellipse cx="17" cy="16" rx="3" ry="2.5" />
          {:else if type === 'local'}
            <rect x="3" y="4" width="18" height="13" rx="2" />
            <path d="M8 21h8M12 17v4M12 8v5M9.5 10.5 12 13l2.5-2.5" />
          {:else}
            <path d="M8.5 15.5 15.5 8.5M7 10l-2 2a4.25 4.25 0 0 0 6 6l2-2M11 8l2-2a4.25 4.25 0 0 1 6 6l-2 2" />
          {/if}
        </svg>
      </span>
      <span class="type-copy">
        <span class="type-title">{$t(`edit_list_modal__list_${type}`)}</span>
        <span class="type-description">{$listCreationCopy[type]}</span>
      </span>
    </button>
  {/each}
</div>

<style lang="less">
  .list-types {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 6px;
    outline: none;
  }
  .type-option {
    display: flex;
    align-items: center;
    gap: 14px;
    width: 100%;
    padding: 12px;
    color: var(--color-font);
    text-align: left;
    cursor: pointer;
    background: transparent;
    border: 0;
    border-radius: 8px;
    transition: background-color 150ms cubic-bezier(0.2, 0, 0, 1);
  }
  .type-option:hover,
  .type-option:focus-visible {
    background: var(--color-button-background-hover);
  }
  .type-icon {
    display: grid;
    flex: none;
    place-items: center;
    width: 52px;
    height: 52px;
    color: var(--color-font);
    background: var(--color-button-background-hover);
    border-radius: 50%;
  }
  .type-icon svg {
    width: 26px;
    height: 26px;
  }
  .type-copy {
    display: flex;
    flex-direction: column;
    gap: 5px;
    min-width: 0;
  }
  .type-title {
    font-size: 17px;
    font-weight: 650;
    line-height: 1.35;
  }
  .type-description {
    color: var(--color-font-label);
    font-size: 13px;
    line-height: 1.5;
    text-wrap: pretty;
  }
  @media (max-width: 400px) {
    .type-option {
      gap: 12px;
      padding: 10px;
    }
    .type-icon {
      width: 44px;
      height: 44px;
    }
    .type-title {
      font-size: 16px;
    }
  }
</style>
