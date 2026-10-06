export const viewTypes = ['app', 'extensions', 'extension', 'logs'] as const

export type ViewType = (typeof viewTypes)[number]
