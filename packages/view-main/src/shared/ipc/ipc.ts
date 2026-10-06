import app from './app/remote'
import command from './command/remote'
import dislike from './dislike/remote'
import extension from './extension/remote'
import hotkey from './hotkey/remote'
import list from './list/remote'
import player from './player/remote'
import sync from './sync/remote'
import theme from './theme/remote'
import { ipcConnection } from './connection'

export { ipc } from './connection'

export const connectIPC = (
  onConnected: () => void,
  onDisconnected: () => void,
  onFailed: (message: string) => void,
  onLogout: () => void,
  pwd = ''
) => {
  if (!ipcConnection.service) {
    if (!window.__anylisten_ipc_init__) throw new Error('ipc is not available')
    ipcConnection.service = window.__anylisten_ipc_init__
    delete window.__anylisten_ipc_init__
  }
  const exposeFuncs: AnyListen.IPC.ClientIPC = {
    ...app,
    ...dislike,
    ...extension,
    ...hotkey,
    ...list,
    ...player,
    ...theme,
    ...sync,
    ...command,
  }
  ipcConnection.service({
    clientCall: exposeFuncs,
    onConnected: (_ipc) => {
      ipcConnection.client = _ipc
      window.testData = _ipc
      onConnected()
    },
    onDisconnected,
    onFailed,
    onLogout,
    pwd,
  })
}
