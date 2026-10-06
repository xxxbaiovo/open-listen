// import '@common/utils/rendererError'
import { mount } from 'svelte'

import App from './App.svelte'

import 'virtual:svg-icons-register'

import './app.less'
import '@fontsource-variable/noto-sans-sc'
import { initNotify } from './components/apis/notify'
import { initTooltips } from './components/apis/tooltips/global'
import { connectIPC, registerModules } from './modules'
import { initIpcDesktopLyric } from './shared/ipcLyric/init'
import { initWorkers } from './worker'
import { initFocusIndicator } from './shared/browser/focus'

// import './components/base/VirtualizedList'
void initWorkers()
const disposeFocusIndicator = initFocusIndicator()
if (import.meta.hot) import.meta.hot.dispose(disposeFocusIndicator)

mount(App, {
  target: document.getElementById('root')!,
})
initNotify()

registerModules()
initIpcDesktopLyric()
connectIPC()
initTooltips()
