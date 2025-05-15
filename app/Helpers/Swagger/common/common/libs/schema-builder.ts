import { RouteDefault, RouteResponseDefault } from 'App/Helpers/Swagger/common/common'
import { Header, Methods, Route, RouteResponse, RouteType } from '../models/route.model'

/**
 * Build a new environment or route response header
 */
export const BuildHeader = (key = '', value = ''): Header => ({ key, value })

/**
 * Build a new route response
 */
export const BuildRouteResponse = (): RouteResponse => ({
  ...RouteResponseDefault,
})

/**
 * Build a new HTTP route
 */
export const BuildHTTPRoute = (
  hasDefaultRouteResponse = true,
  options: {
    endpoint: typeof RouteDefault.endpoint
    body: typeof RouteResponseDefault.body
  } = {
    endpoint: RouteDefault.endpoint,
    body: RouteResponseDefault.body,
  }
): Route => {
  const defaultResponse = {
    ...BuildRouteResponse(),
    default: true,
    body: options.body,
  }

  return {
    ...RouteDefault,
    type: RouteType.HTTP,
    method: Methods.get,
    endpoint: options.endpoint,
    responses: hasDefaultRouteResponse ? [defaultResponse] : [],
  }
}
