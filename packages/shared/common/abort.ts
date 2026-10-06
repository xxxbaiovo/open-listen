// Bound waits for unresponsive plugins; late results cannot settle the caller twice.
export const withAbortSignal = async <T>(promise: Promise<T>, signal?: AbortSignal): Promise<T> => {
  if (!signal) return promise
  return new Promise<T>((resolve, reject) => {
    const abort = () => {
      signal.removeEventListener('abort', abort)
      reject(signal.reason instanceof Error ? signal.reason : new Error('Request aborted'))
    }
    signal.addEventListener('abort', abort, { once: true })
    void promise.then(resolve).catch(reject).finally(() => { signal.removeEventListener('abort', abort) })
    if (signal.aborted) abort()
  })
}
