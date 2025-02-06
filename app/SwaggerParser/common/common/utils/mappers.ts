import { BodyTypes, Header, Route, RouteResponse } from '../models/route.model'
import { HeaderInterface, ResponseInterface } from 'App/Interfaces/HeaderInterface'
import { RouteInterface } from 'App/Interfaces/RouteInterface'

export function mapHeader(header: Header): HeaderInterface {
  return {
    key: header.key,
    value: header.value,
  }
}

export function mapResponse(response: RouteResponse): ResponseInterface {
  return {
    id: 0,
    status: response.statusCode,
    body: JSON.stringify(response.body),
    name: response.label,
    isFile: response.body === BodyTypes.FILE,
    enabled: true,
    headers: response.headers.map(mapHeader),
    routeId: 0,
  }
}

export function mapRoute(route: Route): RouteInterface {
  return {
    id: 0,
    name: route.name,
    endpoint: route.endpoint,
    method: route.method,
    enabled: true,
    isFolder: false,
    order: 0,
    tag: route.tags[0],
    responses: route.responses.map(mapResponse),
    parentFolderId: null,
  }
}
