// Share foreground/preload requests, expire URLs, and let timed-out requests be retried.
export const createResourceRequests = <T>(ttl: number, timeout: number, capacity = 16) => {
  const cached = new Map<string, { value: T; expires: number }>()
  const pending = new Map<string, { promise: Promise<T>; refresh: boolean }>()
  // eslint-disable-next-line @typescript-eslint/promise-function-async -- Preserve the shared in-flight promise identity.
  const get = (key: string, load: () => Promise<T>, refresh = false): Promise<T> => {
    if (refresh) cached.delete(key)
    const inFlight = pending.get(key)
    if (inFlight && (!refresh || inFlight.refresh)) return inFlight.promise
    const hit = cached.get(key)
    if (hit && hit.expires > Date.now()) return Promise.resolve(hit.value)
    cached.delete(key)

    let timer: ReturnType<typeof setTimeout>
    const job = { refresh, promise: null as unknown as Promise<T> }
    job.promise = new Promise<T>((resolve, reject) => {
      timer = setTimeout(() => { reject(new Error('Resource request timed out')) }, timeout)
      void Promise.resolve().then(load).then(resolve).catch(reject)
    }).then((value) => {
      if (ttl > 0 && pending.get(key) === job) {
        cached.set(key, { value, expires: Date.now() + ttl })
        while (cached.size > capacity) cached.delete(cached.keys().next().value!)
      }
      return value
    }).finally(() => {
      clearTimeout(timer)
      if (pending.get(key) === job) pending.delete(key)
    })
    pending.set(key, job)
    return job.promise
  }
  return { get }
}
