<script lang="ts">
  import { appState } from '@/modules/app/store/state'
  import { settingState } from '@/modules/setting/store/state'
  import { buildUrl } from '@any-listen/web'

  let {
    src,
    alt = 'PIC',
    icon = 'loading',
    width = '100%',
    height = '100%',
    loading = 'lazy',
    decoding = 'async',
    onerror,
  }: {
    src?: string | null
    icon?: string
    alt?: string
    width?: number | string
    height?: number | string
    decoding?: 'async' | 'auto' | 'sync'
    loading?: 'lazy' | 'eager'
    onerror?: () => void
  } = $props()
  let isError = $state(false)

  let derivedSrc = $derived(
    src ? buildUrl(src, settingState.setting['network.proxyAllResources'], appState.proxyServerHost) : undefined
  )
  $effect(() => {
    if (src) isError = false
  })
</script>

{#if derivedSrc && !isError}
  <img
    src={derivedSrc}
    class="pic img"
    {alt}
    style:width
    style:height
    {loading}
    {decoding}
    onerror={() => {
      isError = true
      onerror?.()
    }}
  />
{:else}
  <div style:width style:height class="pic empty-pic" class:loading-placeholder={icon === 'loading'} class:load-error={isError}>
    {#if icon === 'loading'}
      <div class="loading-content" aria-hidden="true">
        <span class="loading-dots"><i></i><i></i><i></i></span>
        <span class="loading-label">Loading</span>
      </div>
    {:else}
      <svg version="1.1" viewBox="0 0 192 192" width="78%" aria-hidden="true">
        <use xlink:href={`#icon-${icon}`} />
      </svg>
    {/if}
  </div>
{/if}

<style lang="less">
  .img {
    aspect-ratio: 1;
    // width: 100%;
    // height: 100%;
    object-fit: cover;
    border-radius: @radius-border;
    box-shadow: 0 0 2px var(--color-primary-dark-200-alpha-800);
  }
  .empty-pic {
    // width: 100%;
    // height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    // letter-spacing: 3px;
    aspect-ratio: 1;
    color: var(--color-font-label);
    user-select: none;
    background-color: var(--color-surface-raised, var(--color-content-background));
    // font-size: 20px;
    // font-family: Consolas, 'Courier New', monospace;
    border-radius: @radius-border;
    box-shadow: none;
  }
  .loading-placeholder {
    container-type: inline-size;
    color: #e5e5e5;
    background: #080808;
    border: 1px solid #929292;
    border-radius: 6px;
  }
  .loading-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: clamp(6px, 8cqw, 18px);
    padding-top: 8%;
  }
  .loading-dots {
    display: flex;
    align-items: center;
    gap: clamp(4px, 4cqw, 10px);
  }
  .loading-dots i {
    width: clamp(3px, 4cqw, 8px);
    height: clamp(3px, 4cqw, 8px);
    background: currentColor;
    border-radius: 50%;
    animation: loading-pulse 1.2s ease-in-out infinite;
  }
  .loading-dots i:nth-child(2) { animation-delay: 150ms; }
  .loading-dots i:nth-child(3) { animation-delay: 300ms; }
  .loading-label {
    font-size: clamp(8px, 10cqw, 20px);
    font-weight: 400;
    line-height: 1.2;
  }
  @keyframes loading-pulse {
    0%, 80%, 100% { opacity: 0.5; transform: scale(0.85); }
    40% { opacity: 1; transform: scale(1); }
  }
  .load-error .loading-dots i {
    animation: none;
  }
  @media (prefers-reduced-motion: reduce) {
    .loading-dots i { animation: none; }
  }
</style>
