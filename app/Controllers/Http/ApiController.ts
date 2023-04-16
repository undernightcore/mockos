import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Project from 'App/Models/Project'

export default class ApiController {
  public async mock({ request, auth, params, response, bouncer, i18n }: HttpContextContract) {
    await auth.authenticate()
    const projectId = request.headers().project
    const method = request.method().toLowerCase()
    const endpoint = '/' + (params['*']?.join('/') ?? '')
    if (projectId === undefined)
      return response
        .status(500)
        .json({ errors: [i18n.formatMessage('responses.api.mock.missing_project_header')] })
    const project = await Project.findOrFail(projectId)
    await bouncer.with('ProjectPolicy').authorize('isMember', project, i18n)
    const routes = await project
      .related('routes')
      .query()
      .where('method', '=', method)
      .andWhere('enabled', '=', true)
      .orderBy('order')
    const regexList = routes.map(
      (route) =>
        new RegExp(
          `^${route.endpoint.replace('/', '\\/').replace(new RegExp('{(.+?)}', 'g'), '(.+)')}$`
        )
    )
    const routeIndex = regexList.findIndex((regex) => regex.test(endpoint))
    if (routeIndex === -1)
      return response
        .status(400)
        .json({ errors: [i18n.formatMessage('responses.api.mock.missing_route')] })
    const enabledResponse = await routes[routeIndex]
      .related('responses')
      .query()
      .where('enabled', '=', true)
      .first()
    return response
      .status(enabledResponse ? 200 : 404)
      .json(
        enabledResponse
          ? enabledResponse.body
          : { errors: [i18n.formatMessage('responses.api.mock.missing_response')] }
      )
  }
}
