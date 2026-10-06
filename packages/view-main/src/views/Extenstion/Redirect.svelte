<script lang="ts">
  import { onMount } from 'svelte'
  import { getLocation, replace } from '@/plugins/svelte-spa-router/navigator'

  onMount(() => {
    const params = getLocation().query
    void replace('/settings', { ...params, type: 'extensions', view: params.type ?? params.view ?? 'installed' })
  })
</script>
