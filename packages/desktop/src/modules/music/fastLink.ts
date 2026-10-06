import { existsSync } from 'node:fs'
import path from 'node:path'

import { getExtSource } from '@any-listen/app/modules/resources/utils'

import { appState } from '@/app'
import { request } from '@/shared/request'

import { createFastLinkResolver, getFastLinkId } from './fastLinkCore'

export const canUseFastLink = (musicInfo: AnyListen.Music.MusicInfo, quality: string) =>
  !existsSync(path.join(appState.dataPath, 'disable-fast-link')) &&
  getFastLinkId(musicInfo, quality) !== null &&
  getExtSource('musicUrl', [], 'gd-netease')?.extensionId === 'gdstudio'

export const resolveFastLink = createFastLinkResolver(async (id, signal) => {
  const response = await request<{ url?: string; br?: number }>(
    'https://music-api.gdstudio.xyz/api.php',
    {
      query: { types: 'url', source: 'netease', id, br: '128' },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'X-Requested-With': 'XMLHttpRequest',
        Referer: 'https://music.gdstudio.org/',
      },
      timeout: 4000,
      retryNum: 0,
      signal,
    }
  )
  if (response.statusCode !== 200) throw new Error('Fast link upstream unavailable')
  const body = typeof response.body === 'string' ? JSON.parse(response.body) : response.body
  if (!body || typeof body.url !== 'string' || !/^https?:\/\/\S+$/.test(body.url)) {
    throw new Error('Fast link returned no playable URL')
  }
  // Do not silently accept another quality; let the original provider handle it.
  if (body.br != null && Number(body.br) !== 128) throw new Error('Fast link quality mismatch')
  return { url: body.url, quality: '128k', isFromCache: false }
})
