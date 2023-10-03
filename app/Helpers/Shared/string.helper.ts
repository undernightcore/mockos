import { randomBytes } from 'crypto'
import { load } from 'js-yaml'

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

export function parseFromJsonOnYaml(value: string) {
  try {
    return { value: JSON.parse(value), wasJSON: true }
  } catch {
    return { value: load(value), wasJSON: false }
  }
}

export function randomString(size: number) {
  return randomBytes(size / 2).toString('hex')
}
