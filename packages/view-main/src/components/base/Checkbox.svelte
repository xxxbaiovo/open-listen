<script lang="ts">
  import type { Snippet } from 'svelte'
  let {
    checked,
    id,
    name,
    arialabel,
    label,
    disabled = false,
    onchange,
    children,
    variant = 'checkbox',
  }: {
    checked: boolean
    id: string
    name?: string
    arialabel?: string
    label?: string
    disabled?: boolean
    onchange: (checked: boolean) => void
    children?: Snippet
    variant?: 'checkbox' | 'switch'
  } = $props()
</script>

<div class="checkbox" class:switch={variant === 'switch'} class:disabled>
  <label for={id} class="content">
    <input
      {id}
      {name}
      type="checkbox"
      role={variant === 'switch' ? 'switch' : undefined}
      class="input"
      {checked}
      {disabled}
      aria-label={arialabel ?? label}
      oninput={(event) => onchange(event.currentTarget.checked)}
      onkeydown={(event) => {
        if (event.key === 'Enter' && !disabled) {
          event.preventDefault()
          onchange(!checked)
        }
      }}
    />
    <span class="control" aria-hidden="true"></span>
    {#if children}{@render children()}{:else}<span class="label">{label}</span>{/if}
  </label>
</div>

<style lang="less">
  .checkbox {
    display: inline-flex;
    font-size: var(--text-body, 14px);
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
  .control {
    position: relative;
    flex: none;
    width: 18px;
    height: 18px;
    border: 1.5px solid var(--color-font-label);
    border-radius: 4px;
    background: transparent;
    transition:
      background-color 150ms,
      border-color 150ms;
  }
  .control::after {
    position: absolute;
    top: 2px;
    left: 5px;
    width: 5px;
    height: 9px;
    content: '';
    border-right: 1.5px solid var(--color-accent-on, #111);
    border-bottom: 1.5px solid var(--color-accent-on, #111);
    transform: rotate(45deg);
    opacity: 0;
  }
  .input:checked + .control {
    background: var(--color-primary);
    border-color: var(--color-primary);
  }
  .input:checked + .control::after {
    opacity: 1;
  }
  .input:focus-visible + .control {
    outline: var(--focus-ring);
    outline-offset: -2px;
  }
  .label {
    font-size: inherit;
    font-weight: 450;
    line-height: 1.55;
  }
  .disabled {
    opacity: 0.45;
  }
  .disabled .content {
    cursor: not-allowed;
  }
  .switch {
    width: 100%;
  }
  .switch .content {
    flex: 1;
    flex-direction: row-reverse;
    justify-content: space-between;
    gap: 24px;
    min-height: 40px;
  }
  .switch .input {
    right: 0;
    width: 38px;
    height: 22px;
  }
  .switch .control {
    width: 38px;
    height: 22px;
    border: 0;
    border-radius: 20px;
    background: var(--color-switch-track, #616161);
  }
  .switch .control::after {
    top: 3px;
    left: 3px;
    width: 16px;
    height: 16px;
    border: none;
    border-radius: 50%;
    background: #fff;
    opacity: 1;
    transform: translateX(0);
    box-shadow: 0 1px 3px #0003;
    transition:
      transform 150ms cubic-bezier(0.2, 0, 0, 1),
      background-color 150ms;
  }
  .switch .input:checked + .control::after {
    transform: translateX(16px);
    background: var(--color-accent-on, #111);
  }
</style>
