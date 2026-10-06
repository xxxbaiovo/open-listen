export const buildMusicRequestKey = (
  extId: string,
  source: string,
  page: number,
  limit: number,
  text: string,
  artist = ''
) => JSON.stringify({ extId, source, page, limit, text, ...(artist ? { artist } : {}) })

export const buildMusicQueryKey = (extId: string, source: string, limit: number, text: string, artist: string) =>
  JSON.stringify({ extId, source, limit, text, artist })

export const buildMusicSourceKey = (extId: string, source: string) => JSON.stringify([extId, source])

interface CacheEntry<T> {
  scope: string
  group: string
  value: T
  expiresAt: number
}
interface PendingEntry<T> {
  scope: string
  promise: Promise<T>
}

export class PageCache<T> {
  private readonly pages = new Map<string, CacheEntry<T>>()
  private readonly pending = new Map<string, PendingEntry<T>>()
  private readonly maxPages: number
  private readonly ttl: number
  private readonly now: () => number

  constructor(options: { maxPages: number; ttl: number; now?: () => number }) {
    this.maxPages = options.maxPages
    this.ttl = options.ttl
    this.now = options.now ?? Date.now
  }

  get size() {
    return this.pages.size
  }

  get(key: string): T | undefined {
    const entry = this.pages.get(key)
    if (!entry) return
    if (entry.expiresAt <= this.now()) {
      this.pages.delete(key)
      return
    }
    this.pages.delete(key)
    this.pages.set(key, entry)
    return entry.value
  }

  latest(group: string): T | undefined {
    for (const [key, entry] of [...this.pages].reverse()) {
      if (entry.expiresAt <= this.now()) {
        this.pages.delete(key)
        continue
      }
      if (entry.group === group) return entry.value
    }
  }

  request(
    key: string,
    group: string,
    scope: string,
    load: () => Promise<T>,
    force = false
  ): { promise: Promise<T>; result?: T } {
    if (force) {
      this.pages.delete(key)
    } else {
      const result = this.get(key)
      if (result !== undefined) return { promise: Promise.resolve(result), result }
      const pending = this.pending.get(key)
      if (pending) return { promise: pending.promise }
    }
    const promise: Promise<T> = Promise.resolve()
      .then(load)
      .then((value) => {
        if (this.pending.get(key)?.promise === promise) {
          this.pending.delete(key)
          for (const [oldKey, entry] of this.pages) {
            if (entry.expiresAt <= this.now()) this.pages.delete(oldKey)
          }
          this.pages.delete(key)
          this.pages.set(key, { scope, group, value, expiresAt: this.now() + this.ttl })
          while (this.pages.size > this.maxPages) {
            const oldest = this.pages.keys().next().value
            if (oldest === undefined) break
            this.pages.delete(oldest)
          }
        }
        return value
      })
      .catch((error: unknown) => {
        if (this.pending.get(key)?.promise === promise) this.pending.delete(key)
        throw error
      })
    this.pending.set(key, { scope, promise })
    return { promise }
  }

  clearScope(scope: string) {
    for (const [key, entry] of this.pages) {
      if (entry.scope === scope) this.pages.delete(key)
    }
    for (const [key, entry] of this.pending) {
      if (entry.scope === scope) this.pending.delete(key)
    }
  }

  clear() {
    this.pages.clear()
    this.pending.clear()
  }
}
