import { request } from '@any-listen/nodejs/request'

import { getConfig } from '../shared/configStore'
import { createNativeGdSearch, supportsNativeGdSearch } from './gdstudio'

const adapters = new WeakMap<
  AnyListen.Extension.Extension,
  { loadTimestamp: number; search: ReturnType<typeof createNativeGdSearch> }
>()

export const nativeMusicSearch = async (
  extension: AnyListen.Extension.Extension,
  params: AnyListen.IPCExtension.MusicSearchParams
) => {
  if (params.extensionId !== extension.id || !supportsNativeGdSearch(extension, params.source)) return
  const config = await getConfig(extension)
  if (config.useOrgSource === true) {
    adapters.delete(extension)
    return
  }
  let adapter = adapters.get(extension)
  // eslint-disable-next-line @typescript-eslint/prefer-optional-chain -- A missing adapter must initialize even without a timestamp.
  if (!adapter || adapter.loadTimestamp !== extension.loadTimestamp) {
    adapter = {
      loadTimestamp: extension.loadTimestamp,
      search: createNativeGdSearch(async (url, options) => request(url, options)),
    }
    adapters.set(extension, adapter)
  }
  return adapter.search(params)
}
