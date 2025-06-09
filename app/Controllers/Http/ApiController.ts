import { I18nContract } from '@ioc:Adonis/Addons/I18n'
import Drive from '@ioc:Adonis/Core/Drive'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { RequestContract } from '@ioc:Adonis/Core/Request'
import { ResponseContract } from '@ioc:Adonis/Core/Response'
import { HttpError } from 'App/Models/HttpError'
import Project from 'App/Models/Project'
import Response from 'App/Models/Response'
import Route from 'App/Models/Route'
import Token from 'App/Models/Token'
import { Buffer } from 'buffer'
import Sandbox from 'v8-sandbox'

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
      .andWhere('is_folder', '=', false)
      .orderBy('order')
    const { enabledResponse, routeParams } = await this.#getFirstMatchingRouteOrFail(
      routes,
      endpoint,
      i18n
    )
    if (!enabledResponse)
      throw new HttpError(404, i18n.formatMessage('responses.api.mock.missing_response'))

    const file = enabledResponse.isFile
      ? await Drive.get(`responses/${enabledResponse.body}`)
      : undefined
    const headers = await this.#getHeadersOrDefault(enabledResponse, Boolean(file))
    return this.#prepareResponse(headers, enabledResponse, routeParams, file, request, response)
  }

  // Helper functions
  async #authenticateProject(request: RequestContract, i18n: I18nContract) {
    const requestToken: string | undefined = request.param('token') || request.header('token')
    if (!requestToken) {
      throw new HttpError(400, i18n.formatMessage('responses.api.mock.missing_token'))
    }

    const token = await Token.findBy('token', requestToken)
    if (!token) {
      throw new HttpError(400, i18n.formatMessage('responses.api.mock.wrong_token'))
    }

    const project = await Project.find(token.projectId)
    if (!project) {
      throw new HttpError(400, i18n.formatMessage('responses.api.mock.wrong_token'))
    }

    return project
  }

  async #getFirstMatchingRouteOrFail(routes: Route[], endpoint: string, i18n: I18nContract) {
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
      return {
        enabledResponse: await routes[routeIndex]
          .related('responses')
          .query()
          .preload('processor')
          .where('enabled', '=', true)
          .first(),
        routeParams: this.#getHydratedRouteParams(
          routes[routeIndex],
          endpoint,
          regexList[routeIndex]
        ),
      }
    }
  }

  #getHydratedRouteParams(route: Route, endpoint: string, regex: RegExp) {
    const keys =
      route.endpoint
        .match(regex)
        ?.filter((value) => typeof value === 'string')
        .map((key) => key.replace(/[{}]/g, ''))
        .slice(1) ?? []

    const values =
      endpoint
        .match(regex)
        ?.filter((value) => typeof value === 'string')
        .slice(1) ?? []

    return Object.fromEntries(keys.map((key, index) => [key, values[index]]))
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

  async #prepareResponse(
    headers: { key: string; value: string }[],
    enabledResponse: Response,
    params: { [key: string]: string },
    file: Buffer | undefined,
    request: RequestContract,
    response: ResponseContract
  ) {
    const processed = await this.#preprocessRequest(enabledResponse, params, request, file)

    return headers
      .reduce(
        (acc, { key, value }) => acc.safeHeader(key, value),
        response.status(enabledResponse.status)
      )
      .send(processed)
  }

  async #preprocessRequest(
    enabledResponse: Response,
    params: { [key: string]: string },
    request: RequestContract,
    file: Buffer | undefined
  ) {
    if (enabledResponse.processor?.enabled && !file) {
      const sandbox = new Sandbox()
      const { error, value } = await sandbox.execute({
        code: enabledResponse.processor.code,
        timeout: 2000,
        globals: {
          queryParams: request.qs(),
          url: request.url(),
          params,
          body: request.body(),
          headers: request.headers(),
          content: enabledResponse.body,
        },
      })
      sandbox.shutdown()

      if (error) {
        throw new HttpError(400, `The preprocessor code crashed: ${error.message}`)
      }

      return String(value)
    }

    return file ?? enabledResponse.body
  }
}
