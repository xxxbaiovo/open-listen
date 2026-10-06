import { PageCache } from './pageCache'

export interface InitState {
  cache: PageCache<AnyListen.IPCResource.MusicListResult>
  prefetchPromise: Promise<AnyListen.IPCResource.MusicListResult> | null
}

export const musicState: InitState = {
  cache: new PageCache<AnyListen.IPCResource.MusicListResult>({ maxPages: 48, ttl: 30 * 60_000 }),
  prefetchPromise: null
}
