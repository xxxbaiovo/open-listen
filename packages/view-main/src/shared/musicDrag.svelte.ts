import { LIST_IDS } from '@any-listen/common/constants'
import { addListMusics, createUserList } from '@/modules/musicLibrary/store/actions'
import { musicLibraryState } from '@/modules/musicLibrary/store/state'
import { showNotify } from '@/components/apis/notify'
import { i18n } from '@/plugins/i18n'

export const musicDrag = $state<{ tracks: AnyListen.Music.MusicInfo[]; targetId: string }>({ tracks: [], targetId: '' })
let dragImage: HTMLDivElement | undefined
let cancelActiveDrag: (() => void) | undefined

export const endMusicDrag = () => {
  musicDrag.tracks = []
  musicDrag.targetId = ''
  dragImage?.remove()
  dragImage = undefined
}

export const canAddToPlaylist = (list: AnyListen.List.MyListInfo) =>
  list.type === 'general' || list.id === LIST_IDS.LOVE

const addDraggedMusic = async (tracks: AnyListen.Music.MusicInfo[], list?: AnyListen.List.MyListInfo) => {
  try {
    // Snapshot removes nested Svelte proxies before crossing the Electron IPC boundary.
    const songs = structuredClone($state.snapshot(tracks))
    let id = list?.id
    if (!id) {
      const names = musicLibraryState.userLists.map((item) => item.name)
      let index = 1
      while (names.includes(`${i18n.t('ui.my_playlist')} #${index}`)) index++
      id = await createUserList(musicLibraryState.userLists.length, {
        id: '', name: `${i18n.t('ui.my_playlist')} #${index}`, type: 'general', parentId: null,
        meta: { createTime: 0, updateTime: 0, songCount: 0, playCount: 0, posTime: 0, pic: '', desc: '' },
      })
    }
    if (!id) return
    await addListMusics(id, songs)
    showNotify(i18n.t('music_add_modal_add_success'))
  } catch (error) {
    showNotify(error instanceof Error ? error.message : String(error))
  }
}

// Handle app-internal dragging without depending on native HTML drag support.

export const startPointerMusicDrag = (event: MouseEvent, tracks: AnyListen.Music.MusicInfo[]) => {
  if (event.button !== 0 || !tracks.length || event.altKey) return
  if ('pointerType' in event && event.pointerType === 'touch') return
  const interactive = (event.target as Element).closest('button, input, a, [role="slider"]')
  if (interactive && !interactive.hasAttribute('data-music-drag-handle')) return
  cancelActiveDrag?.()
  event.preventDefault()
  const origin = { x: event.clientX, y: event.clientY }
  let started = false
  const moveEventName = event.type === 'pointerdown' ? 'pointermove' : 'mousemove'
  const upEventName = event.type === 'pointerdown' ? 'pointerup' : 'mouseup'
  const move = (moveEvent: MouseEvent) => {
    if (!started) {
      if (Math.hypot(moveEvent.clientX - origin.x, moveEvent.clientY - origin.y) < 7) return
      started = true
      endMusicDrag()
      musicDrag.tracks = tracks.slice()
      dragImage = document.createElement('div')
      dragImage.textContent = tracks.length > 1 ? `${tracks[0].name} + ${tracks.length - 1}` : [tracks[0].name, tracks[0].singer].filter(Boolean).join(' · ')
      dragImage.style.cssText = 'position:fixed;top:0;left:0;z-index:99999;pointer-events:none;max-width:320px;padding:10px 16px;border-radius:8px;background:#282828;color:#fff;box-shadow:0 8px 24px #0005;font:600 14px sans-serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;'
      document.body.appendChild(dragImage)
    }
    moveEvent.preventDefault()
    if (dragImage) dragImage.style.transform = `translate3d(${moveEvent.clientX + 14}px, ${moveEvent.clientY + 14}px, 0)`
    const target = document.elementFromPoint(moveEvent.clientX, moveEvent.clientY)?.closest<HTMLElement>('[data-music-drop-id]')
    musicDrag.targetId = target?.dataset.musicDropId ?? ''
  }
  const cleanup = () => {
    window.removeEventListener(moveEventName, move, true)
    window.removeEventListener(upEventName, finish, true)
    window.removeEventListener('pointercancel', cancel)
    window.removeEventListener('blur', cancel)
    window.removeEventListener('keydown', keydown, true)
    cancelActiveDrag = undefined
  }
  const cancel = () => { cleanup(); endMusicDrag() }
  const keydown = (keyEvent: KeyboardEvent) => {
    if (keyEvent.key === 'Escape') { keyEvent.preventDefault(); cancel() }
  }
  const finish = (upEvent: MouseEvent) => {
    cleanup()
    if (!started) return
    upEvent.preventDefault()
    upEvent.stopPropagation()
    const preventClick = (click: MouseEvent) => { click.preventDefault(); click.stopImmediatePropagation() }
    window.addEventListener('click', preventClick, { capture: true, once: true })
    setTimeout(() => window.removeEventListener('click', preventClick, true), 0)
    const id = musicDrag.targetId
    const list = id === LIST_IDS.LOVE ? musicLibraryState.loveList : musicLibraryState.userLists.find((item) => item.id === id)
    const songs = $state.snapshot(musicDrag.tracks)
    endMusicDrag()
    if (id === '__new__' || (list && canAddToPlaylist(list))) void addDraggedMusic(songs, list)
  }
  window.addEventListener(moveEventName, move, true)
  window.addEventListener(upEventName, finish, true)
  window.addEventListener('pointercancel', cancel)
  window.addEventListener('blur', cancel)
  window.addEventListener('keydown', keydown, true)
  cancelActiveDrag = cancel
}
