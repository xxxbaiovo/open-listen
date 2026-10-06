<script lang="ts">
  import { location, query, replace } from '@/plugins/svelte-spa-router/navigator'
  import SettingList from './SettingList.svelte'
  import SettingView from './SettingView.svelte'
  import { settings } from './settings'

  const activeSetting = $derived(settings.find((setting) => setting.id === $query.id) ?? settings[0])

  $effect(() => {
    if ($location !== '/settings' || ($query.type && $query.type !== 'app')) return
    if ($query.id && activeSetting && $query.id !== activeSetting.id) {
      void replace('/settings', { ...$query, type: 'app', id: activeSetting.id })
    }
  })
</script>

<div class="settings-app-container">
  {#if settings.length}
    <SettingList
      active={activeSetting.id}
      onchange={(id: string) => {
        void replace('/settings', { type: 'app', id })
      }}
    />
  {/if}
  {#if activeSetting}
    <SettingView settings={activeSetting} />
  {/if}
</div>

<style lang="less">
  .settings-app-container {
    display: flex;
    flex-flow: row nowrap;
    height: 100%;
    min-height: 0;
    padding-top: 12px;
  }
  @container (max-width: 620px) {
    .settings-app-container {
      flex-direction: column;
      padding-top: 0;
    }
  }
</style>
