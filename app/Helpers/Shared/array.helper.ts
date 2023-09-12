export function move(arr, old_index, new_index) {
  arr.splice(new_index, 0, arr.splice(old_index, 1)[0])
}

export function getLastIndex(arr: any[], condition: (item: any) => boolean) {
  const reversedIndex = arr.slice().reverse().findIndex(condition)
  return reversedIndex === -1 ? -1 : arr.length - reversedIndex - 1
}
