import { randomBytes } from 'crypto'

export function prettifyJson(value: string) {
  return isValidJson(value) ? JSON.stringify(JSON.parse(value)) : value
}

export function isValidJson(value: string) {
  try {
    JSON.parse(value)
    return true
  } catch {
    return false
  }
}

export function parseJsonIfPossible(value: string) {
  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}

export function randomString(size: number) {
  return randomBytes(size / 2).toString('hex')
}
