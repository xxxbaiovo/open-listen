<script lang="ts" generics="T">
  import type { Snippet } from 'svelte'
  let {
    value,
    checked,
    id,
    name,
    arialabel,
    label,
    disabled = false,
    onselect,
    children,
  }: {
    value: T
    checked?: boolean
    id: string
    name?: string
    arialabel?: string
    label?: string
    disabled?: boolean
    onselect: (value: T) => void
    children?: Snippet
  } = $props()
</script>

<div class="radio" class:checked class:disabled>
  <label for={id} class="content">
    <input
      {id}
      {name}
      {value}
      {checked}
      {disabled}
      type="radio"
      class="input"
      aria-label={arialabel ?? label}
      oninput={() => onselect(value)}
      onkeydown={(event) => {
        if (event.key === 'Enter' && !disabled) {
          event.preventDefault()
          onselect(value)
        }
      }}
    />
    <span class="container" aria-hidden="true"></span>
    {#if children}{@render children()}{:else}<span class="label">{label}</span>{/if}
  </label>
</div>

<style lang="less">
  .radio {
    display: inline-flex;
    vertical-align: middle;
  }
  .content {
    position: relative;
    display: flex;
    align-items: center;
    gap: 9px;
    min-height: 28px;
    cursor: pointer;
  }
  .input {
    position: absolute;
    z-index: 1;
    width: 18px;
    height: 18px;
    margin: 0;
    opacity: 0;
    cursor: inherit;
  }
  .container {
    position: relative;
    flex: none;
    width: 18px;
    height: 18px;
    border: 1.5px solid var(--color-font-label);
    border-radius: 50%;
    transition:
      border-color 150ms,
      background-color 150ms;
  }
  .container::after {
    position: absolute;
    inset: 4px;
    content: '';
    border-radius: 50%;
    background: var(--color-accent-on, #111);
    opacity: 0;
  }
  .input:checked + .container {
    border-color: var(--color-primary);
    background: var(--color-primary);
  }
  .input:checked + .container::after {
    opacity: 1;
  }
  .input:focus-visible + .container {
    outline: var(--focus-ring);
    outline-offset: -2px;
  }
  .label {
    font-size: var(--text-body, 14px);
    font-weight: 450;
    line-height: 1.5;
  }
  .disabled {
    opacity: 0.45;
  }
  .disabled .content {
    cursor: not-allowed;
  }
</style>
