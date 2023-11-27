import { randomBytes } from 'crypto'
import { load } from 'js-yaml'

export function compressJson(value: string) {
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

export function parseFromJsonOrYaml(value: string) {
  try {
    return JSON.parse(value)
  } catch {
    return load(value)
  }
}

export function randomString(size: number) {
  return randomBytes(size / 2).toString('hex')
}
