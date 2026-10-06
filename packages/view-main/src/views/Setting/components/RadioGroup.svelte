<script lang="ts">
  import type { Snippet } from 'svelte'
  import TitleContent from './TitleContent.svelte'

  let {
    name,
    desc,
    children,
    theme = false,
  }: {
    name?: string
    desc?: string
    children?: Snippet
    theme?: boolean
  } = $props()
</script>

<TitleContent {name} {desc}>
  <div class="settings-item-radio-group" class:theme role="radiogroup" aria-label={name}>
    {#if children}
      {@render children()}
    {/if}
  </div>
</TitleContent>

<style lang="less">
  .settings-item-radio-group {
    display: flex;
    flex-flow: row wrap;
    gap: 8px;
    margin-top: 5px;
    margin-bottom: 5px;
    margin-left: 0;
  }
  .theme {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    width: min(100%, 300px);
    gap: 8px;
  }
  @container (max-width: 400px) {
    .theme {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
</style>
