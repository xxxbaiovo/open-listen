<script lang="ts">
  import { t } from '@/plugins/i18n'
  import { fade } from 'svelte/transition'
  import Btn from './Btn.svelte'
  import SvgIcon from './SvgIcon.svelte'

  let {
    loading,
    error,
    errorMessage,
    onreload,
  }: {
    loading: boolean
    error: boolean
    errorMessage?: string
    onreload?: () => void
  } = $props()
</script>

{#if loading}
  <div class="loading" in:fade={{ delay: 150, duration: 150 }} out:fade={{ duration: 200 }}>
    <div class="content" role="status" aria-label={$t('list_loading')}>
      <span class="spinner" aria-hidden="true"></span>
    </div>
  </div>
{/if}
{#if error && !loading}
  <div class="error" transition:fade={{ duration: 200 }}>
    <div class="content">
      <p role="status">{errorMessage ? $t('list_error_message', { msg: errorMessage }) : $t('list_error')}</p>
      <p>
        {#if onreload}
          <Btn
            icontext
            onclick={() => {
              onreload?.()
            }}
          >
            <SvgIcon name="refresh" />
            {$t('list_reload')}
          </Btn>
        {/if}
      </p>
    </div>
  </div>
{/if}

<style lang="less">
  .loading,
  .error {
    position: absolute;
    top: 0;
    left: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    font-size: 14px;

    &::before {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      content: '';
      background-color: var(--color-content-background);
      opacity: 0.7;
    }
  }
  .content {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    gap: 15px;
    align-items: center;
  }
  .spinner {
    width: 28px;
    height: 28px;
    box-sizing: border-box;
    border: 2px solid color-mix(in srgb, var(--color-font) 15%, transparent);
    border-top-color: var(--color-font);
    border-radius: 50%;
    animation: loading-spin 800ms linear infinite;
  }
  @keyframes loading-spin {
    to { transform: rotate(360deg); }
  }
  @media (prefers-reduced-motion: reduce) {
    .spinner { animation: none; }
  }
</style>
