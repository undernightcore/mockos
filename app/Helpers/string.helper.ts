export function prettifyJson(value: string) {
  return JSON.stringify(JSON.parse(value))
}
