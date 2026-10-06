<script lang="ts">
  import { onMount } from 'svelte'
  import Popup from '@/components/base/Popup.svelte'
  import SvgIcon from '@/components/base/SvgIcon.svelte'
  import { showNotify } from '@/components/apis/notify'
  import { t } from '@/plugins/i18n'
  import { setMediaDeviceId } from '@/plugins/player'
  import { playerEvent } from '@/modules/player/store/event'
  import {
    getMediaDevices, getMediaDeviceIdSetting, getHasMediaDevicePermission,
    requestMediaDevicePermission, saveMediaDeviceIdSetting,
  } from '@/modules/player/store/mediaDevice'

  let visible = $state(false)
  let trigger = $state<HTMLButtonElement | null>(null)
  let content = $state<HTMLDivElement | null>(null)
  let devices = $state<Array<{ deviceId: string; label: string }>>([])
  let selected = $state(getMediaDeviceIdSetting())
  let loading = $state(false)
  let changing = $state(false)
  let needsPermission = $state(false)
  let error = $state('')
  const supported = typeof HTMLMediaElement.prototype.setSinkId === 'function'
  const popupId = $props.id()
  let generation = 0

  const refresh = async () => {
    const request = ++generation
    loading = true
    error = ''
    try {
      const list = await getMediaDevices()
      if (request !== generation) return
      devices = list
      selected = getMediaDeviceIdSetting()
      needsPermission = !!import.meta.env.VITE_IS_WEB && !getHasMediaDevicePermission()
    } catch {
      if (request === generation) error = $t('ui.output_failed')
    } finally {
      if (request === generation) loading = false
    }
  }
  const select = async (id: string) => {
    if (changing || id === selected) return
    const previous = selected
    changing = true
    error = ''
    try {
      // Apply first, so a failed switch never appears as a successfully selected device.
      await setMediaDeviceId(id)
      await saveMediaDeviceIdSetting(id)
      // eslint-disable-next-line require-atomic-updates -- The changing guard serializes device selections.
      selected = id
    } catch {
      await setMediaDeviceId(previous).catch(() => {})
      error = $t('ui.output_failed')
      showNotify(error)
    } finally {
      // eslint-disable-next-line require-atomic-updates -- Only this selection can clear its pending state.
      changing = false
    }
  }
  const authorize = async () => {
    if (await requestMediaDevicePermission()) await refresh()
    else error = $t('settings.player.media_device_get_permission_failed')
  }
  onMount(() => {
    const refreshWhenOpen = () => { if (visible) void refresh() }
    navigator.mediaDevices?.addEventListener('devicechange', refreshWhenOpen)
    const unsub = playerEvent.on('mediaDeviceChanged', () => { selected = getMediaDeviceIdSetting() })
    return () => {
      generation++
      navigator.mediaDevices?.removeEventListener('devicechange', refreshWhenOpen)
      unsub()
    }
  })
</script>

<svelte:window onpointerdown={(event) => {
  if (visible && event.target instanceof Node && !trigger?.contains(event.target) && !content?.contains(event.target)) visible = false
}} />

<button type="button" class="output-toggle" class:active={visible || selected !== 'default'} bind:this={trigger}
  aria-label={$t('ui.output_device')} title={$t('ui.output_device')} aria-expanded={visible} aria-haspopup="dialog" aria-controls={popupId}
  onclick={() => { visible = !visible; if (visible && supported) void refresh() }}
  onkeydown={(event) => {
    if (event.key === 'Escape' && visible) { event.preventDefault(); event.stopPropagation(); visible = false }
    if (event.key === ' ' || event.key === 'Enter') event.stopPropagation()
  }} onkeyup={(event) => { if (event.key === ' ' || event.key === 'Enter') event.stopPropagation() }}>
  <SvgIcon name="devices" />
</button>
<Popup bind:visible btnel={trigger} maxheight={360} onmouseenter={() => {}} onmouseleave={() => {}}>
  <div class="output-panel" id={popupId} bind:this={content} role="dialog" aria-label={$t('ui.output_device')} tabindex="-1"
    onkeydown={(event) => {
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); visible = false }
      if (event.key === ' ' || event.key === 'Enter') event.stopPropagation()
    }} onkeyup={(event) => { if (event.key === ' ' || event.key === 'Enter') event.stopPropagation() }}>
    <header><h3>{$t('ui.output_device')}</h3><button class="close" aria-label={$t('btn_close')} onclick={() => (visible = false)}><SvgIcon name="close" /></button></header>
    {#if !supported}<p class="hint">{$t('ui.output_not_supported')}</p>
    {:else}
      <div class="device-list" role="group" aria-label={$t('ui.output_device')} aria-busy={loading || changing}>
        {#each devices as device (device.deviceId)}
          <button class="device" class:selected={selected === device.deviceId} disabled={changing}
            aria-pressed={selected === device.deviceId} onclick={async () => select(device.deviceId)}>
            <SvgIcon name="devices" /><span>{device.deviceId === 'default' ? $t('ui.output_default') : device.label}</span>
            {#if selected === device.deviceId}<svg class="check" viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6" fill="none" stroke="currentColor" stroke-width="1.5" /></svg>{/if}
          </button>
        {/each}
      </div>
      {#if loading}<p class="hint" role="status">{$t('ui.output_loading')}</p>{/if}
      {#if needsPermission}<p class="hint">{$t('settings.player.media_device_permission_tip')}</p><button class="refresh" disabled={changing} onclick={authorize}>{$t('settings.player.media_device_get_permission')}</button>{/if}
      <button class="refresh" disabled={loading || changing} onclick={refresh}>{$t('ui.output_refresh')}</button>
      {#if error}<p class="error" role="alert">{error}</p>{/if}
    {/if}
  </div>
</Popup>

<style lang="less">
  .output-toggle { display: grid; flex: none; place-items: center; width: 32px; height: 36px; padding: 0; color: var(--color-font-label); background: transparent; border: 0; border-radius: 4px; cursor: pointer; }
  .output-toggle :global(svg) { width: 22px; height: 22px; }
  .output-toggle:hover { color: var(--color-font); }
  .output-toggle.active { color: var(--color-primary); }
  .output-panel { width: 300px; max-width: calc(100vw - 48px); padding: 8px; color: var(--color-font); }
  header { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 0 8px 12px; }
  h3 { font-size: 16px; font-weight: 650; }
  button { color: inherit; cursor: pointer; background: transparent; border: 0; border-radius: 6px; }
  button:disabled { cursor: default; opacity: 0.6; }
  button:focus-visible { outline: 2px solid var(--color-font); outline-offset: 2px; }
  .close { display: grid; place-items: center; width: 28px; height: 28px; padding: 4px; }
  .device-list { display: flex; flex-direction: column; gap: 4px; max-height: 210px; overflow: auto; }
  .device { display: flex; align-items: center; gap: 12px; padding: 12px 8px; text-align: left; }
  .device:hover, .close:hover { background: var(--color-primary-background-hover); }
  .device :global(svg) { flex: none; width: 22px; height: 22px; }
  .device span { flex: 1; min-width: 0; overflow-wrap: anywhere; font-size: 13px; line-height: 1.5; }
  .device.selected { color: var(--color-primary); }
  .device .check { width: 18px; }
  .hint, .error { margin: 8px; font-size: 12px; line-height: 1.6; color: var(--color-font-label); }
  .error { color: var(--color-font-error); }
  .refresh { padding: 10px 8px; font-size: 12px; font-weight: 600; }
  .refresh:hover { text-decoration: underline; }
</style>
