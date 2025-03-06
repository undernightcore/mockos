export function move(arr, old_index, new_index) {
  arr.splice(new_index, 0, arr.splice(old_index, 1)[0])
}

export function getLastIndex(arr: any[], condition: (item: any) => boolean) {
  const reversedIndex = arr.slice().reverse().findIndex(condition)
  return reversedIndex === -1 ? -1 : arr.length - reversedIndex - 1
}

export function toMap<T>(list: T[], getter: (item: T) => string | number): Map<string | number, T> {
  const map = new Map<string | number, T>()

  for (const item of list) {
    map.set(getter(item), item)
  }

  return map
}
