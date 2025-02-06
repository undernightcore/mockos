import { ResponseInterface } from 'App/Interfaces/ResponseInterface'

export interface RouteInterface {
  id: number
  name: string
  endpoint: string
  method: string
  enabled: boolean
  isFolder: boolean
  order: number
  responses: ResponseInterface[]
  parentFolderId: number | null
  tag?: string
}
