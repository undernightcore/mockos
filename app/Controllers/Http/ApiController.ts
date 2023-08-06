import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Project from 'App/Models/Project'
import Drive from '@ioc:Adonis/Core/Drive'
import { HttpError } from 'App/Models/HttpError'
import { RequestContract } from '@ioc:Adonis/Core/Request'
import { ResponseContract } from '@ioc:Adonis/Core/Response'
import { I18nContract } from '@ioc:Adonis/Addons/I18n'
import Route from 'App/Models/Route'
import Response from 'App/Models/Response'
import { Buffer } from 'buffer'

export default class ApiController {
  public async mock({ request, params, response, i18n }: HttpContextContract) {
    const project = await this.#authenticateProject(request, i18n)
    const method = request.method().toLowerCase()
    const endpoint = '/' + (params['*']?.join('/') ?? '')
    const routes = await project
      .related('routes')
      .query()
      .where('method', '=', method)
      .andWhere('enabled', '=', true)
      .orderBy('order')
    const enabledResponse = await this.#getFirstMatchingRouteOrFail(routes, endpoint, i18n)
    if (!enabledResponse)
      throw new HttpError(404, i18n.formatMessage('responses.api.mock.missing_response'))

    const file = enabledResponse.isFile
      ? await Drive.get(`responses/${enabledResponse.body}`)
      : undefined
    const headers = await this.#getHeadersOrDefault(enabledResponse, Boolean(file))
    return this.#prepareResponse(headers, enabledResponse, file, response)
  }

  // Helper functions

  async #authenticateProject(request: RequestContract, i18n: I18nContract) {
    const token = request.header('token')
    const projectId = request.header('project')
    if (projectId === undefined) {
      throw new HttpError(400, i18n.formatMessage('responses.api.mock.missing_project_header'))
    }
    if (token === undefined) {
      throw new HttpError(400, i18n.formatMessage('responses.api.mock.missing_token_header'))
    }
    const project = await Project.findOrFail(projectId)
    const isTokenValid = Boolean(
      await project.related('tokens').query().where('token', token).first()
    )
    if (!isTokenValid) {
      throw new HttpError(400, i18n.formatMessage('responses.api.mock.wrong_token'))
    }
    return project
  }

  #getFirstMatchingRouteOrFail(routes: Route[], endpoint: string, i18n: I18nContract) {
    const regexList = routes.map(
      (route) =>
        // Replace {} dynamic values in path to regex dynamic value
        new RegExp(
          `^${route.endpoint.replace('/', '\\/').replace(new RegExp('{(.+?)}', 'g'), '([^/]+)')}$`
        )
    )
    const routeIndex = regexList.findIndex((regex) => regex.test(endpoint))
    if (routeIndex === -1) {
      throw new HttpError(400, i18n.formatMessage('responses.api.mock.missing_route'))
    } else {
      return routes[routeIndex].related('responses').query().where('enabled', '=', true).first()
    }
  }

  async #getHeadersOrDefault(response: Response, isFile: boolean) {
    const dbHeaders = await response.related('headers').query()
    const headers = dbHeaders.map(({ key, value }) => ({ key, value }))
    const foundContentType = headers.find((header) => header.key === 'content-type')
    const defaultContentType = {
      key: 'content-type',
      value: isFile ? 'application/octet-stream' : 'application/json',
    }
    return foundContentType ? headers : [...headers, defaultContentType]
  }

  #prepareResponse(
    headers: { key: string; value: string }[],
    enabledResponse: Response,
    file: Buffer | undefined,
    response: ResponseContract
  ) {
    return headers
      .reduce(
        (acc, { key, value }) => acc.safeHeader(key, value),
        response.status(enabledResponse.status)
      )
      .send(file ?? enabledResponse.body)
  }
}
