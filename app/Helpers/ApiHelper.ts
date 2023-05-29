import { RequestContract } from '@ioc:Adonis/Core/Request'
import { I18nContract } from '@ioc:Adonis/Addons/I18n'
import Route from 'App/Models/Route'
import { isValidJson } from 'App/Helpers/Shared/string.helper'
import { HttpError } from 'App/Models/HttpError'

export class ApiHelper {
  public static getProjectHeaderOrFail(request: RequestContract, i18n: I18nContract) {
    const projectId = request.headers().project
    if (projectId === undefined) {
      throw new HttpError(400, i18n.formatMessage('responses.api.mock.missing_project_header'))
    } else {
      return projectId
    }
  }

  public static checkIfJsonOrFail(value: string, i18n: I18nContract) {
    if (!isValidJson(value))
      throw new HttpError(400, i18n.formatMessage('responses.api.mock.invalid_json'))
    return value
  }

  public static getFirstMatchingRouteOrFail(routes: Route[], endpoint: string, i18n: I18nContract) {
    const regexList = routes.map(
      (route) =>
        // Replace {} dynamic values in path to regex dynamic value
        new RegExp(
          `^${route.endpoint.replace('/', '\\/').replace(new RegExp('{(.+?)}', 'g'), '(.+)')}$`
        )
    )
    const routeIndex = regexList.findIndex((regex) => regex.test(endpoint))
    if (routeIndex === -1) {
      throw new HttpError(400, i18n.formatMessage('responses.api.mock.missing_route'))
    } else {
      return routes[routeIndex].related('responses').query().where('enabled', '=', true).first()
    }
  }
}
