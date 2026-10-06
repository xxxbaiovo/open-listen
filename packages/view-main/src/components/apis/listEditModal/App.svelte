<script lang="ts">
  import Modal from '@/components/material/Modal.svelte'
  import { i18n, t } from '@/plugins/i18n'
  import ListTypeSelect from './ListTypeSelect.svelte'
  import { musicLibraryState } from '@/modules/musicLibrary/store/state'
  import GeneralListForm from './GeneralListForm.svelte'
  import type { ComponentExports } from 'svelte'
  import RemoteListForm from './remoteListForm/RemoteListForm.svelte'
  import { showNotify } from '../notify'
  import LocalListForm from './LocalListForm.svelte'
  import OnlineListForm from './OnlineListForm.svelte'
  import { listCreationCopy, type CreatableListType } from './copy'

  let { onafterleave }: { onafterleave: () => void } = $props()
  let visible = $state(false)
  let isEdit = $state(false)
  let choosing = $state(true)
  let submitting = $state(false)
  let listType = $state<AnyListen.List.UserListType>('general')
  let targetId = $state<string | undefined>()
  let form = $state<ComponentExports<typeof GeneralListForm>>()
  let targetInfo = $state<AnyListen.List.UserListInfo | null>(null)

  const closeModal = () => {
    if (!submitting) visible = false
  }
  const chooseType = (type: CreatableListType) => {
    listType = type
    choosing = false
  }
  const handleConfirm = async () => {
    if (!form || submitting) return
    submitting = true
    try {
      await form.submit()
      visible = false
    } catch (e) {
      console.error(e)
      showNotify(
        i18n.t(isEdit ? 'edit_list_modal__edit_failed' : 'edit_list_modal__create_failed', {
          err: (e as Error).message
        })
      )
    } finally {
      // eslint-disable-next-line require-atomic-updates -- Concurrent submissions are blocked before the await.
      submitting = false
    }
  }
  const handleKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.stopPropagation()
      closeModal()
    } else if (event.key === 'Tab') {
      const controls = [
        ...(event.currentTarget as HTMLElement).querySelectorAll<HTMLElement>(
          'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), summary, [tabindex="0"]'
        )
      ].filter((element) => element.getClientRects().length > 0)
      const first = controls[0]
      const last = controls[controls.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last?.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first?.focus()
      }
    }
  }
  export const show = (_targetId?: string, _isEdit = false, type?: CreatableListType) => {
    targetId = _targetId
    isEdit = _isEdit
    targetInfo = null
    listType = type ?? 'general'
    choosing = !_isEdit && !type
    if (_isEdit) {
      const info = musicLibraryState.userLists.find((list) => list.id === _targetId)
      if (!info) return
      targetInfo = info
      listType = info.type
    }
    visible = true
  }
</script>

<Modal
  bind:visible
  teleport="#root"
  closebtn={false}
  bgclose={false}
  onclose={() => !submitting}
  {onafterleave}
  minwidth="0"
  minheight="0"
  maxwidth="calc(100% - 24px)"
  maxheight="min(84%, 680px)"
>
  <div
    class="list-editor"
    class:choosing
    role="dialog"
    aria-modal="true"
    aria-label={isEdit ? $t('edit_list_modal__edit_title') : $t('edit_list_modal__new_title')}
    tabindex="-1"
    onkeydown={handleKeydown}
  >
    <header class="editor-header">
      {#if !choosing && !isEdit}
        <button
          type="button"
          class="icon-button"
          aria-label={$t('btn_back')}
          disabled={submitting}
          onclick={() => {
            choosing = true
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"
            ><path d="m14 6-6 6 6 6" /></svg
          >
        </button>
      {/if}
      <h2>
        {isEdit
          ? $t('edit_list_modal__edit_title')
          : choosing
            ? $t('edit_list_modal__new_title')
            : $t(`edit_list_modal__list_${listType}`)}
      </h2>
      <button
        type="button"
        class="icon-button close-button"
        aria-label={$t('btn_close')}
        disabled={submitting}
        onclick={closeModal}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"
          ><path d="m6 6 12 12M6 18 18 6" /></svg
        >
      </button>
    </header>
    {#if choosing}
      <ListTypeSelect onselect={chooseType} />
    {:else}
      <form
        onsubmit={(event) => {
          event.preventDefault()
          void handleConfirm()
        }}
        aria-busy={submitting}
      >
        <div class="form-content">
          {#if listType === 'general'}
            <GeneralListForm bind:this={form} {targetId} item={targetInfo as AnyListen.List.GeneralListInfo | null} />
          {:else if listType === 'local'}
            <LocalListForm bind:this={form} {targetId} item={targetInfo as AnyListen.List.LocalListInfo | null} />
          {:else if listType === 'remote'}
            <RemoteListForm bind:this={form} {targetId} item={targetInfo as AnyListen.List.RemoteListInfo | null} />
          {:else if listType === 'online' && isEdit}
            <OnlineListForm bind:this={form} {targetId} item={targetInfo as AnyListen.List.OnlineListInfo | null} />
          {/if}
        </div>
        <footer class="editor-footer">
          <button type="button" class="cancel-button" disabled={submitting} onclick={closeModal}
            >{$t('btn_cancel')}</button
          >
          <button type="submit" class="submit-button" disabled={submitting}
            >{isEdit ? $listCreationCopy.save : $listCreationCopy.create}</button
          >
        </footer>
      </form>
    {/if}
  </div>
</Modal>

<style lang="less">
  :global(.modal > .content:has(> .list-editor)) {
    background: var(--color-surface-raised, var(--color-content-background));
    border-radius: 14px;
    box-shadow:
      0 8px 24px #0003,
      0 24px 64px #0004;
  }
  :global(.modal > .content:has(> .list-editor) > .header) {
    display: none;
  }
  .list-editor {
    display: flex;
    flex-direction: column;
    width: 420px;
    max-width: 100%;
    min-height: 0;
    color: var(--color-font);
    outline: none;
  }
  .list-editor.choosing {
    width: 376px;
    padding-bottom: 6px;
  }
  .editor-header {
    display: flex;
    flex: none;
    align-items: center;
    gap: 8px;
    padding: 20px 20px 12px;
  }
  h2 {
    flex: 1;
    min-width: 0;
    font-size: 21px;
    font-weight: 650;
    line-height: 1.35;
  }
  button {
    font: inherit;
    cursor: pointer;
    border: 0;
    transition:
      background-color 150ms cubic-bezier(0.2, 0, 0, 1),
      color 150ms cubic-bezier(0.2, 0, 0, 1);
  }
  button:disabled {
    cursor: wait;
    opacity: 0.55;
  }
  .icon-button {
    display: grid;
    flex: none;
    place-items: center;
    width: 32px;
    height: 32px;
    padding: 7px;
    color: var(--color-font-label);
    background: transparent;
    border-radius: 50%;
  }
  .icon-button:hover {
    color: var(--color-font);
    background: var(--color-button-background-hover);
  }
  .icon-button svg {
    width: 18px;
    height: 18px;
  }
  form {
    display: flex;
    flex-direction: column;
    min-height: 0;
  }
  .form-content {
    min-height: 0;
    padding: 8px 24px;
    overflow: auto;
    scrollbar-width: thin;
  }
  .form-content :global(.input) {
    width: 100%;
    min-height: 44px;
    color: var(--color-font);
    background: var(--color-input-background, var(--color-content-background));
    border: 1px solid var(--color-border);
    border-radius: 6px;
  }
  .form-content :global(.input:hover),
  .form-content :global(.input:focus),
  .form-content :global(.input:active) {
    background: var(--color-input-background, var(--color-content-background)) !important;
    border-color: var(--color-font-label);
  }
  .editor-footer {
    display: flex;
    flex: none;
    align-items: center;
    justify-content: flex-end;
    gap: 10px;
    padding: 20px 24px 24px;
  }
  .cancel-button,
  .submit-button {
    min-width: 78px;
    min-height: 40px;
    padding: 10px 20px;
    border-radius: 22px;
    font-size: 14px;
    font-weight: 600;
  }
  .cancel-button {
    color: var(--color-font-label);
    background: transparent;
  }
  .cancel-button:hover {
    color: var(--color-font);
    background: var(--color-button-background-hover);
  }
  .submit-button {
    color: var(--color-accent-on, #111);
    background: var(--color-primary);
  }
  .submit-button:hover {
    filter: brightness(1.07);
  }
  @media (max-width: 400px) {
    .editor-header {
      padding: 16px 16px 10px;
    }
    .form-content {
      padding: 8px 18px;
    }
    .editor-footer {
      padding: 18px;
    }
  }
</style>
