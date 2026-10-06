<script lang="ts">
  import { i18n, t } from '@/plugins/i18n'
  import { createUserList, editUserList, selectLocalFolder } from './shared'
  import Input from '@/components/base/Input.svelte'
  import FormItem from './FormItem.svelte'
  import Btn from '@/components/base/Btn.svelte'
  import { appState } from '@/modules/app/store/state'
  import Checkbox from '@/components/base/Checkbox.svelte'
  import { listCreationCopy } from './copy'

  let {
    item,
    targetId
  }: {
    item?: AnyListen.List.LocalListInfo | null
    targetId?: AnyListen.List.ParentId
  } = $props()

  const initData: AnyListen.List.LocalListInfo = {
    id: '',
    name: '',
    parentId: null,
    type: 'local',
    meta: {
      deviceId: '',
      path: '',
      includeSubDir: false,
      lazzyParseMeta: false,
      createTime: 0,
      updateTime: 0,
      desc: '',
      playCount: 0,
      posTime: 0,
      pic: '',
      songCount: 0,
      syncTime: 0
    }
  }
  let listInfo = $state<AnyListen.List.LocalListInfo>(initData)
  let updateDeviceId = $state(true)

  export const verify = () => {
    const name = listInfo.name.trim()
    if (!name.length || name.length > 30) {
      throw new Error(i18n.t('edit_list_modal__form_err_name'))
    }
    if (!listInfo.meta.path) {
      throw new Error(i18n.t('edit_list_modal.local_list_form.path_empty'))
    }
  }
  export const reset = () => {
    listInfo = {
      ...initData,
      id: targetId || '',
      meta: { ...initData.meta, deviceId: appState.machineId }
    }
    updateDeviceId = true
  }
  export const submit = async () => {
    verify()
    if (item) {
      await editUserList({
        ...listInfo,
        meta: updateDeviceId ? { ...listInfo.meta, deviceId: appState.machineId } : listInfo.meta
      })
    } else {
      await createUserList({ ...listInfo, parentId: targetId || null })
    }
  }

  $effect(() => {
    if (item) {
      listInfo = {
        ...item,
        meta: { ...item.meta }
      }
      updateDeviceId = item.meta.deviceId === appState.machineId
    } else reset()
  })
</script>

<main class="main">
  <label class="name-field">
    <span>{$t('edit_list_modal__form_list_name')}</span>
    <Input
      autofocus
      aria-label={$t('edit_list_modal__form_list_name')}
      placeholder={$t('edit_list_modal__form_list_name')}
      bind:value={listInfo.name}
    />
  </label>
  {#if appState.machineId !== listInfo.meta.deviceId}
    <FormItem>
      <Checkbox
        id="path_update_device_id"
        checked={updateDeviceId}
        onchange={(checked) => {
          updateDeviceId = checked
          if (!checked && item) {
            listInfo.meta.path = item.meta.path
          }
        }}
        label={$t('edit_list_modal.local_list_form.path_update_device_id')}
      />
      <p class="tip">{$t('edit_list_modal.local_list_form.path_device_diff')}</p>
    </FormItem>
  {/if}
  <FormItem>
    <p class="path code">{listInfo.meta.path || $t('edit_list_modal.local_list_form.path_empty')}</p>
    {#snippet right()}
      <Btn
        middle
        disabled={!updateDeviceId}
        onclick={() => {
          void selectLocalFolder().then((path) => {
            if (path) {
              listInfo.meta.path = path
            }
          })
        }}>{$t('edit_list_modal.local_list_form.path_edit')}</Btn
      >
    {/snippet}
  </FormItem>
  <FormItem>
    <Checkbox
      id="path_include_sub_dir"
      checked={listInfo.meta.includeSubDir}
      onchange={(checked) => {
        listInfo.meta.includeSubDir = checked
      }}
      label={$t('edit_list_modal.local_list_form.path_include_sub_dir')}
    />
    <p class="tip">{$t('edit_list_modal.local_list_form.path_include_sub_dir_tip')}</p>
  </FormItem>
  <details class="advanced">
    <summary>{$listCreationCopy.advanced}</summary>
    <div class="advanced-content">
      <FormItem>
        <Checkbox
          id="path_enabled_remove"
          checked={listInfo.meta.enabledRemove || false}
          onchange={(checked) => {
            listInfo.meta.enabledRemove = checked
          }}
          label={$t('edit_list_modal.local_list_form.path_enabled_remove')}
        />
        <p class="tip">{$t('edit_list_modal.local_list_form.path_enabled_remove_tip')}</p>
      </FormItem>
      <FormItem>
        <Checkbox
          id="lazzy_parse_meta"
          checked={listInfo.meta.lazzyParseMeta || false}
          onchange={(checked) => {
            listInfo.meta.lazzyParseMeta = checked
          }}
          label={$t('edit_list_modal.lazzy_parse_meta')}
        />
        <p class="tip">{$t('edit_list_modal.lazzy_parse_meta_tip')}</p>
      </FormItem>
      <FormItem>
        <Checkbox
          id="use_polling"
          checked={listInfo.meta.usePolling || false}
          onchange={(checked) => {
            listInfo.meta.usePolling = checked
          }}
          label={$t('edit_list_modal.local_list_form.use_polling')}
        />
        <p class="tip">{$t('edit_list_modal.local_list_form.use_polling_tip')}</p>
      </FormItem>
      <FormItem>
        <Checkbox
          id="ignore_permission_errors"
          checked={listInfo.meta.ignorePermissionErrors || false}
          onchange={(checked) => {
            listInfo.meta.ignorePermissionErrors = checked
          }}
          label={$t('edit_list_modal.local_list_form.ignore_permission_errors')}
        />
        <p class="tip">{$t('edit_list_modal.local_list_form.ignore_permission_errors_tip')}</p>
      </FormItem>
    </div>
  </details>
</main>

<style lang="less">
  .name-field {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 6px;
    font-size: 13px;
    font-weight: 600;
  }
  .advanced {
    margin-top: 6px;
    border-top: 1px solid var(--color-border);
  }
  summary {
    padding: 12px 0 4px;
    color: var(--color-font-label);
    font-size: 13px;
    cursor: pointer;
  }
  summary:hover {
    color: var(--color-font);
  }
  .advanced-content {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding-top: 10px;
  }
  .main {
    display: flex;
    // flex: auto;
    // padding: 0 15px;
    // width: 320px;
    flex-flow: column nowrap;
    gap: 8px;
    // min-height: 0;
    // max-height: 100%;
    // overflow: hidden;
  }
  .path {
    padding-right: 8px;
    font-size: 13px;
    // color: var(--color-primary);
  }
  .tip {
    // padding-left: 19px;
    font-size: 12px;
    opacity: 0.7;
  }
</style>
