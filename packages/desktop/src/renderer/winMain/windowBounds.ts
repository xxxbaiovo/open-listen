import { readFileSync, writeFileSync, renameSync } from 'node:fs'

export interface SavedWindowBounds { x: number; y: number; width: number; height: number; maximized: boolean }

export const readWindowBounds = (file: string): SavedWindowBounds | null => {
  try {
    const value = JSON.parse(readFileSync(file, 'utf8'))
    if (!value || !['x', 'y', 'width', 'height'].every((key) => Number.isFinite(value[key]))) return null
    if (value.width < 1 || value.height < 1) return null
    return { x: Math.round(value.x), y: Math.round(value.y), width: Math.round(value.width), height: Math.round(value.height), maximized: value.maximized === true }
  } catch { return null }
}

export const fitWindowBounds = (saved: SavedWindowBounds, area: { x: number; y: number; width: number; height: number }) => {
  const width = Math.min(area.width, Math.max(800, saved.width))
  const height = Math.min(area.height, Math.max(540, saved.height))
  return {
    width, height,
    x: Math.max(area.x, Math.min(saved.x, area.x + area.width - width)),
    y: Math.max(area.y, Math.min(saved.y, area.y + area.height - height)),
  }
}

export const saveWindowBounds = (file: string, value: SavedWindowBounds) => {
  try {
    writeFileSync(`${file}.tmp`, JSON.stringify(value))
    renameSync(`${file}.tmp`, file)
  } catch (error) { console.warn('Unable to save window bounds', error) }
}
