import { Header, Route, RouteResponse } from '../models/route.model'
import { ParsedHeaderInterface } from 'App/Interfaces/HeaderInterface'
import { ParsedResponseInterface } from 'App/Interfaces/ResponseInterface'
import { ParsedRouteInterface } from 'App/Interfaces/RouteInterface'

export function mapHeader(header: Header): ParsedHeaderInterface {
  return {
    key: header.key,
    value: header.value,
  }
}

export function mapResponse(response: RouteResponse): ParsedResponseInterface {
  return {
    status: response.statusCode,
    body: JSON.stringify(response.body),
    name: response.label,
    headers: response.headers.map(mapHeader),
  }
}

export function mapRoute(route: Route): ParsedRouteInterface {
  return {
    name: route.name,
    endpoint: route.endpoint,
    method: route.method,
    responses: route.responses.map(mapResponse),
  }
}
