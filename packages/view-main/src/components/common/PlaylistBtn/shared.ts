export type TabType = 'queue' | 'history'

const english = {
  queue: 'Queue',
  recent: 'Recently played',
  now: 'Now playing',
  next: 'Other songs in the queue',
  emptyQueue: 'Your queue is empty',
  emptyNext: 'No other songs in the queue',
  emptyHistory: 'Your recently played songs will appear here',
  failed: 'Could not load recently played songs',
  retry: 'Try again'
}

export const getQueueText = (locale: string): typeof english => {
  if (locale === 'zh-cn') {
    return {
      queue: '队列',
      recent: '最近播放',
      now: '当前播放',
      next: '队列中的其他歌曲',
      emptyQueue: '队列里还没有歌曲',
      emptyNext: '队列中没有其他歌曲',
      emptyHistory: '最近播放的歌曲会显示在这里',
      failed: '暂时无法加载最近播放',
      retry: '重试'
    }
  }
  if (locale.startsWith('zh')) {
    return {
      queue: '佇列',
      recent: '最近播放',
      now: '目前播放',
      next: '佇列中的其他歌曲',
      emptyQueue: '佇列裡還沒有歌曲',
      emptyNext: '佇列中沒有其他歌曲',
      emptyHistory: '最近播放的歌曲會顯示在這裡',
      failed: '暫時無法載入最近播放',
      retry: '重試'
    }
  }
  return english
}
