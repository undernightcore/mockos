export function move(arr, old_index, new_index) {
  arr.splice(new_index, 0, arr.splice(old_index, 1)[0])
}
