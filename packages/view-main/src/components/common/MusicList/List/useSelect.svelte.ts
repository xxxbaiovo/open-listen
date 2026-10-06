export const useSelect = (props: { list: AnyListen.Music.MusicInfo[] }) => {
  let selectedList: AnyListen.Music.MusicInfo[] = $state.raw([])
  let selectIndex = $state(-1)
  return {
    get list() { return selectedList },
    get selectIndex() { return selectIndex },
    clearSelect() { selectedList = []; selectIndex = -1 },
    setSelectIndex(idx: number) { selectIndex = idx },
    override(list: AnyListen.Music.MusicInfo[]) { selectedList = list },
    handleSelect(index: number, modifiers: { shiftKey?: boolean; ctrlKey?: boolean; metaKey?: boolean } = {}) {
      const item = props.list[index]
      if (!item) return
      const additive = modifiers.ctrlKey || modifiers.metaKey
      if (modifiers.shiftKey && selectIndex >= 0) {
        const range = props.list.slice(Math.min(selectIndex, index), Math.max(selectIndex, index) + 1)
        selectedList = additive ? props.list.filter((song) => selectedList.includes(song) || range.includes(song)) : range
      } else {
        selectIndex = index
        selectedList = additive
          ? props.list.filter((song) => song === item ? !selectedList.includes(song) : selectedList.includes(song))
          : [item]
      }
    },
  }
}
