import { derived } from 'svelte/store'
import { _locale } from '@/plugins/i18n'

export type CreatableListType = 'general' | 'local' | 'remote'

const copy = {
  'zh-cn': {
    general: '收集喜欢的歌曲，创建自己的歌单',
    local: '将设备上的音乐整理到列表',
    remote: '连接扩展提供的音乐来源',
    advanced: '更多选项',
    create: '创建',
    save: '保存',
    noSources: '添加支持远程列表的扩展后，即可选择来源。'
  },
  'zh-tw': {
    general: '收藏喜歡的歌曲，建立自己的歌單',
    local: '將裝置上的音樂整理到列表',
    remote: '連接擴充套件提供的音樂來源',
    advanced: '更多選項',
    create: '建立',
    save: '儲存',
    noSources: '加入支援遠端列表的擴充套件後，即可選擇來源。'
  },
  'en-us': {
    general: 'Bring your favorite songs together',
    local: 'Organize music from your device',
    remote: 'Connect a music source from an extension',
    advanced: 'More options',
    create: 'Create',
    save: 'Save',
    noSources: 'Add an extension that supports remote lists to choose a source.'
  }
}

export const listCreationCopy = derived(_locale, (locale) =>
  locale === 'zh-cn' ? copy['zh-cn'] : locale === 'zh-tw' ? copy['zh-tw'] : copy['en-us']
)
