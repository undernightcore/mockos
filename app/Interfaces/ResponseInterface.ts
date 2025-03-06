import { ParsedHeaderInterface } from 'App/Interfaces/HeaderInterface'

export interface ParsedResponseInterface {
  status: number
  body: string
  name: string
  headers: ParsedHeaderInterface[]
}
