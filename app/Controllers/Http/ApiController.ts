import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Project from 'App/Models/Project'
import Drive from '@ioc:Adonis/Core/Drive'
import { ApiHelper } from 'App/Helpers/ApiHelper'
import { HttpError } from 'App/Models/HttpError'

export default class ApiController {
  public async mock({ request, auth, params, response, bouncer, i18n }: HttpContextContract) {
    await auth.authenticate()
    const method = request.method().toLowerCase()
    const endpoint = '/' + (params['*']?.join('/') ?? '')
    const project = await Project.findOrFail(ApiHelper.getProjectHeaderOrFail(request, i18n))
    await bouncer.with('ProjectPolicy').authorize('isMember', project, i18n)
    const routes = await project
      .related('routes')
      .query()
      .where('method', '=', method)
      .andWhere('enabled', '=', true)
      .orderBy('order')
    const enabledResponse = await ApiHelper.getFirstMatchingRouteOrFail(routes, endpoint, i18n)
    if (!enabledResponse)
      throw new HttpError(404, i18n.formatMessage('responses.api.mock.missing_response'))

    const file = enabledResponse.isFile
      ? await Drive.get(`responses/${enabledResponse.body}`)
      : undefined
    return response
      .status(enabledResponse.status)
      .type(file ? 'file' : 'json')
      .send(file ?? ApiHelper.checkIfJsonOrFail(enabledResponse.body, i18n))
  }
}
