import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Response from 'App/Models/Response'
import Route from 'App/Models/Route'
import Project from 'App/Models/Project'
import CreateHeaderValidator from 'App/Validators/Header/CreateHeaderValidator'

export default class HeadersController {
  public async getList({ request, response, auth, bouncer, i18n }: HttpContextContract) {
    await auth.authenticate()
    const res = await Response.findOrFail(request.param('id'))
    const route = await Route.findOrFail(res.id)
    const project = await Project.findOrFail(route.id)
    await bouncer.with('ProjectPolicy').authorize('isMember', project, i18n)
    const page = request.input('page', 1)
    const perPage = request.input('perPage', 10)
    const headers = await res.related('headers').query().paginate(page, perPage)
    return response.ok(headers)
  }

  public async create({ request, response, auth, bouncer, i18n }: HttpContextContract) {
    await auth.authenticate()
    const res = await Response.findOrFail(request.param('id'))
    const route = await Route.findOrFail(res.id)
    const project = await Project.findOrFail(route.id)
    await bouncer.with('ProjectPolicy').authorize('isMember', project, i18n)
    const data = await request.validate(CreateHeaderValidator)
    await res.related('headers').create(data)
    return response.created({
      message: i18n.formatMessage('responses.header.create.header_created'),
    })
  }
}
