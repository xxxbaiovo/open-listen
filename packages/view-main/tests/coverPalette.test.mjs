import assert from 'node:assert/strict'
import test from 'node:test'

import { neutralPalette, paletteFromPixels } from '../src/shared/coverPalette.ts'

const pixels = (...colors) => new Uint8ClampedArray(colors.flat())
const channels = (css) => css.match(/\d+/g).map(Number)
const luminance = (rgb) => {
  const linear = rgb.map((value) => {
    const channel = value / 255
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  })
  return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722
}

test('different covers produce different dominant hues', () => {
  const blue = channels(paletteFromPixels(pixels([24, 90, 230, 255], [24, 90, 230, 255])).background)
  const amber = channels(paletteFromPixels(pixels([245, 145, 24, 255], [245, 145, 24, 255])).background)
  assert.ok(blue[2] > blue[0] && blue[2] > blue[1])
  assert.ok(amber[0] > amber[1] && amber[1] > amber[2])
  assert.notDeepEqual(blue, amber)
})

test('empty, transparent, black and white artwork use a neutral fallback', () => {
  for (const sample of [[], [220, 30, 40, 0], [0, 0, 0, 255], [255, 255, 255, 255]]) {
    assert.deepEqual(paletteFromPixels(pixels(sample)), neutralPalette)
  }
})

test('the predominant color wins over a single colorful outlier', () => {
  const palette = paletteFromPixels(pixels(...Array(20).fill([24, 100, 220, 255]), [230, 24, 40, 255]))
  const [red, , blue] = channels(palette.background)
  assert.ok(blue > red)
  assert.notEqual(palette.background, palette.secondary)
})

test('monochrome artwork stays neutral and supplies two gradient stops', () => {
  const palette = paletteFromPixels(pixels([140, 140, 140, 255]))
  for (const stop of Object.values(palette)) {
    const [r, g, b] = channels(stop)
    assert.equal(r, g)
    assert.equal(g, b)
  }
  assert.notEqual(palette.background, palette.secondary)
})

test('bright artwork retains readable contrast for secondary lyrics across the gradient', () => {
  for (const sample of [
    [255, 240, 24, 255],
    [20, 255, 220, 255],
    [245, 245, 160, 255],
  ]) {
    const palette = paletteFromPixels(pixels(sample, [220, 24, 230, 255]))
    const start = channels(palette.background)
    const end = channels(palette.secondary)
    for (let step = 0; step <= 10; step++) {
      const background = start.map((value, i) => value + ((end[i] - value) * step) / 10)
      const text = background.map((value) => 255 * 0.75 + value * 0.25)
      assert.ok((luminance(text) + 0.05) / (luminance(background) + 0.05) >= 4.5)
    }
  }
})
