<script lang="ts" generics="T">
  import Radio from '@/components/base/Radio.svelte'
  let {
    id,
    name,
    desc,
    value,
    checked,
    disabled,
    onselect,
    group,
    preview,
  }: {
    id: string
    name: string
    desc?: string
    disabled?: boolean
    checked: boolean
    value: T
    onselect: (checked: T) => void
    group?: string
    preview?: { background: string; accent: string }
  } = $props()
</script>

<div class="settings-item-radio" class:theme-option={!!preview} class:checked class:disabled>
  <Radio label={name} name={group} {value} {id} {checked} {onselect} {disabled}>
    {#if preview}
      <span class="theme-swatch" style:background={preview.background} aria-hidden="true"
        ><span style:background={preview.accent}></span></span
      >
    {/if}
    <span class="option-label">{name}</span>
  </Radio>
  {#if desc}<p class="settings-item-desc">{desc}</p>{/if}
</div>

<style lang="less">
  .settings-item-radio {
    display: inline-flex;
    min-width: 0;
    border: 1px solid var(--color-border);
    border-radius: 7px;
    background: transparent;
    transition:
      border-color 150ms,
      background-color 150ms;
  }
  .settings-item-radio:hover:not(.disabled) {
    background: var(--color-primary-background-hover);
    border-color: var(--color-font-label);
  }
  .settings-item-radio.checked {
    border-color: var(--color-font-label);
    background: var(--color-surface-raised, var(--color-primary-background));
  }
  .settings-item-radio :global(.radio) {
    width: 100%;
  }
  .settings-item-radio :global(.content) {
    width: 100%;
    min-height: 40px;
    padding: 8px 12px;
    gap: 9px;
  }
  .option-label {
    min-width: 0;
    font-size: var(--text-small, 13px);
    font-weight: 450;
    line-height: 1.5;
    overflow-wrap: anywhere;
  }
  .checked .option-label {
    font-weight: 550;
  }
  .theme-option {
    min-width: 0;
  }
  .theme-option :global(.content) {
    min-height: 44px;
    padding: 9px 12px;
  }
  .theme-option :global(.container) {
    display: none;
  }
  .theme-option:has(:global(input:focus-visible)) {
    outline: var(--focus-ring);
    outline-offset: -2px;
  }
  .theme-option.checked {
    border-color: var(--color-primary);
  }
  .theme-swatch {
    position: relative;
    display: grid;
    flex: none;
    place-items: center;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    box-shadow: inset 0 0 0 1px #ffffff26;
  }
  .theme-swatch span {
    width: 13px;
    height: 13px;
    border-radius: 50%;
  }
  .theme-option.checked .theme-swatch::after {
    position: absolute;
    width: 4px;
    height: 7px;
    border: solid #fff;
    border-width: 0 1.5px 1.5px 0;
    transform: rotate(45deg);
    content: '';
    filter: drop-shadow(0 1px 1px #0008);
  }
  .settings-item-desc {
    font-size: var(--text-caption, 12px);
    color: var(--color-font-label);
  }
  @container (max-width: 400px) {
    .theme-option :global(.content) {
      gap: 7px;
      padding: 9px 8px;
    }
    .theme-swatch {
      width: 24px;
      height: 24px;
    }
  }
</style>
