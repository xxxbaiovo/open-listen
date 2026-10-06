export interface CoverPalette { background: string; secondary: string }
type RGB = [number, number, number]

export const neutralPalette: CoverPalette = { background: 'rgb(32, 35, 38)', secondary: 'rgb(21, 24, 27)' }

const luminance = (rgb: RGB) => {
  const linear = rgb.map((value) => {
    const channel = value / 255
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  })
  return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722
}
const readableSurface = (color: RGB): RGB => {
  let result: RGB = [...color]
  // Keep even the brighter gradient stop dark enough for secondary white lyrics.
  while (luminance(result) > 0.085) result = result.map((value) => Math.floor(value * 0.94)) as RGB
  return result
}
const cssRgb = (rgb: RGB) => `rgb(${rgb.join(', ')})`

export const paletteFromPixels = (pixels: Uint8ClampedArray): CoverPalette => {
  const buckets = new Map<number, { count: number; score: number; sum: RGB }>()
  for (let i = 0; i < pixels.length; i += 4) {
    if (pixels[i + 3] < 192) continue
    const rgb: RGB = [pixels[i], pixels[i + 1], pixels[i + 2]]
    const max = Math.max(...rgb)
    const min = Math.min(...rgb)
    if (max < 24 || min > 235) continue
    const saturation = max ? (max - min) / max : 0
    const key = (rgb[0] >> 5) * 64 + (rgb[1] >> 5) * 8 + (rgb[2] >> 5)
    const bucket = buckets.get(key) ?? { count: 0, score: 0, sum: [0, 0, 0] as RGB }
    bucket.count++
    bucket.score += 0.35 + saturation
    for (let channel = 0; channel < 3; channel++) bucket.sum[channel] += rgb[channel]
    buckets.set(key, bucket)
  }
  const ranked = [...buckets.values()].sort((a, b) => b.score - a.score)
  if (!ranked.length) return { ...neutralPalette }
  const average = (bucket: (typeof ranked)[number]) => bucket.sum.map((value) => Math.round(value / bucket.count)) as RGB
  const primary = average(ranked[0])
  const secondaryBucket = ranked.find((bucket) =>
    average(bucket).some((value, channel) => Math.abs(value - primary[channel]) > 48)
  )
  const background = readableSurface(primary)
  const secondary = secondaryBucket
    ? readableSurface(average(secondaryBucket))
    : (background.map((value) => Math.round(value * 0.72)) as RGB)
  return { background: cssRgb(background), secondary: cssRgb(secondary) }
}

const cache = new Map<string, CoverPalette>()
export const extractCoverPalette = async (url: string, signal: AbortSignal): Promise<CoverPalette> => {
  const cached = cache.get(url)
  if (cached) return cached
  return new Promise((resolve, reject) => {
    const image = new Image()
    const cleanup = () => {
      clearTimeout(timeout)
      image.onload = null
      image.onerror = null
      signal.removeEventListener('abort', abort)
    }
    const abort = () => {
      cleanup()
      image.src = ''
      reject(new DOMException('Aborted', 'AbortError'))
    }
    const timeout = setTimeout(() => {
      cleanup()
      image.src = ''
      reject(new Error('Cover image timed out'))
    }, 8000)
    image.crossOrigin = 'anonymous'
    image.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = 40
        canvas.height = 40
        const context = canvas.getContext('2d', { willReadFrequently: true })
        if (!context) throw new Error('Canvas unavailable')
        context.drawImage(image, 0, 0, 40, 40)
        const palette = paletteFromPixels(context.getImageData(0, 0, 40, 40).data)
        if (cache.size >= 32) cache.delete(cache.keys().next().value!)
        cache.set(url, palette)
        cleanup()
        resolve(palette)
      } catch (error) {
        cleanup()
        reject(error instanceof Error ? error : new Error('Cover image could not be read'))
      }
    }
    image.onerror = () => {
      cleanup()
      reject(new Error('Cover image unavailable'))
    }
    signal.addEventListener('abort', abort, { once: true })
    if (signal.aborted) {
      abort()
      return
    }
    image.src = url
  })
}
