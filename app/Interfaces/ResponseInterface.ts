import { HeaderInterface } from 'App/Interfaces/HeaderInterface'

export interface ResponseInterface {
  id: number
  status: number
  body: string
  name: string
  isFile: boolean
  enabled: boolean
  headers: HeaderInterface[]
  routeId: number
}
