<script lang="ts">
  import { onDestroy } from 'svelte'
  import { useIsFullscreen } from '@/modules/app/reactive.svelte'
  import { isWindowMaximized } from '@/shared/browser/windowState'
  import { ipc } from '@/shared/ipc/ipc'

  const fullscreen = useIsFullscreen()
  const edges = ['n', 's', 'w', 'e', 'nw', 'ne', 'sw', 'se']
  let pointer: number | null = null
  let frame = 0
  const finish = () => {
    if (pointer === null) return
    pointer = null
    cancelAnimationFrame(frame)
    frame = 0
    void ipc.resizeWindow('end')
  }
  onDestroy(finish)
</script>

{#if !$isWindowMaximized && !fullscreen.isFullscreen}
  <div class="resize-edges" aria-hidden="true">
    {#each edges as edge (edge)}
      <div class="edge {edge}" role="presentation"
        onpointerdown={(event) => {
          if (event.button !== 0) return
          event.preventDefault()
          pointer = event.pointerId
          event.currentTarget.setPointerCapture(pointer)
          void ipc.resizeWindow('start', edge, { x: event.screenX, y: event.screenY })
        }}
        onpointermove={(event) => {
          if (event.pointerId !== pointer || frame) return
          frame = requestAnimationFrame(() => {
            frame = 0
            if (pointer !== null) void ipc.resizeWindow('move')
          })
        }}
        onpointerup={finish}
        onpointercancel={finish}
        onlostpointercapture={finish}></div>
    {/each}
  </div>
{/if}

<style lang="less">
  .resize-edges { position: absolute; inset: 0; z-index: 100; pointer-events: none; }
  .edge { position: absolute; pointer-events: auto; touch-action: none; -webkit-app-region: no-drag; }
  .n, .s { left: 12px; right: 12px; height: 6px; cursor: ns-resize; }
  .n { top: 0; } .s { bottom: 0; }
  .w, .e { top: 12px; bottom: 12px; width: 6px; cursor: ew-resize; }
  .w { left: 0; } .e { right: 0; }
  .nw, .ne, .sw, .se { width: 12px; height: 12px; }
  .nw, .se { cursor: nwse-resize; }
  .ne, .sw { cursor: nesw-resize; }
  .nw { top: 0; left: 0; } .ne { top: 0; right: 0; }
  .sw { bottom: 0; left: 0; } .se { bottom: 0; right: 0; }
</style>
