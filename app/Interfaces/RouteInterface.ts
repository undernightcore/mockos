import { ParsedResponseInterface } from 'App/Interfaces/ResponseInterface'

export interface ParsedRouteInterface {
  name: string
  endpoint: string
  method: string
  responses: ParsedResponseInterface[]
}
