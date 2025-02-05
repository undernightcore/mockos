export interface RouteInterface {
  id: number
  name: string
  endpoint: string
  method: string
  enabled: boolean
  isFolder: boolean
  order: number
  responses: any
  headers: any
  projectId: number
  parentFolderId: number | null
}
