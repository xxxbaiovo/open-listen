interface IPCConnection {
  service: AnyListen.IPC.ConnectIPCSrivice | null
  client: AnyListen.IPC.ServerIPC | null
}

// Keep the live bridge outside the UI/remote-handler import cycle. Re-evaluating
// those modules must not reset the connection initialized by the preload script.
const hotData = import.meta.hot?.data as { ipcConnection?: IPCConnection } | undefined
export const ipcConnection: IPCConnection = hotData?.ipcConnection ?? { service: null, client: null }
if (hotData) hotData.ipcConnection = ipcConnection

export const ipc = new Proxy({} as AnyListen.IPC.ServerIPC, {
  get(_target, property) {
    const client = ipcConnection.client
    if (!client) throw new Error('The app service is not connected yet')
    return client[property as keyof AnyListen.IPC.ServerIPC]
  },
})
