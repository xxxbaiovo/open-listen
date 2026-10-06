import { mount, tick, unmount } from 'svelte'

import { onDesconnected } from '@/modules/app/shared'
import type { CreatableListType } from './copy'

export const showListEditModal = async (targetId?: string, isEdit?: boolean, type?: CreatableListType) => {
  const App = (await import('./App.svelte')).default
  const app = mount(App, {
    target: document.getElementById('root')!,
    props: {
      onafterleave() {
        void unmount(app, { outro: true })
      }
    }
  })
  const unsub = onDesconnected(() => {
    void unmount(app, { outro: true })
    unsub()
  })
  void tick()
    .then(() => {
      app.show(targetId, isEdit, type)
    })
    .finally(() => {
      unsub()
    })
}
