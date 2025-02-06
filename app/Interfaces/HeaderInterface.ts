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

export interface Route {
  id: number
  name: string
  endpoint: string
  method: string
  enabled: boolean
  isFolder: boolean
  order: number
  tag: string
  responses: ResponseInterface[]
  parentFolderId: number | null
}

export interface HeaderInterface {
  key: string
  value: string
}
