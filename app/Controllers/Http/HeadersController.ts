import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Response from 'App/Models/Response'
import Route from 'App/Models/Route'
import Project from 'App/Models/Project'
import CreateHeaderValidator from 'App/Validators/Header/CreateHeaderValidator'
import Header from 'App/Models/Header'
import Ws from 'App/Services/Ws'

export default class HeadersController {
  public async getList({ params, request, response, auth, bouncer, i18n }: HttpContextContract) {
    await auth.authenticate()
    const { res, project } = await this.#getProjectByResponse(params.id)
    await bouncer.with('ProjectPolicy').authorize('isMember', project, i18n)
    const page = request.input('page', 1)
    const perPage = request.input('perPage', 10)
    const headers = await res.related('headers').query().paginate(page, perPage)
    return response.ok(headers)
  }

  public async create({ params, request, response, auth, bouncer, i18n }: HttpContextContract) {
    await auth.authenticate()
    const { res, project } = await this.#getProjectByResponse(params.id)
    await bouncer.with('ProjectPolicy').authorize('isMember', project, i18n)
    const { key, value } = await request.validate(CreateHeaderValidator)
    await res.related('headers').create({ key: key.toLowerCase(), value: value })
    Ws.io.emit(`response:${res.id}`, `headers`)
    return response.created({
      message: i18n.formatMessage('responses.header.create.header_created'),
    })
  }

  public async edit({ params, request, response, auth, bouncer, i18n }: HttpContextContract) {
    await auth.authenticate()
    const { header, project, res } = await this.#getProjectByHeader(params.id)
    await bouncer.with('ProjectPolicy').authorize('isMember', project, i18n)
    const { key, value } = await request.validate(CreateHeaderValidator)
    await header.merge({ key: key.toLowerCase(), value: value }).save()
    Ws.io.emit(`response:${res.id}`, `headers`)
    return response.created({
      message: i18n.formatMessage('responses.header.update.header_updated'),
    })
  }

  public async delete({ params, response, auth, bouncer, i18n }: HttpContextContract) {
    await auth.authenticate()
    const { header, res, project } = await this.#getProjectByHeader(params.id)
    await bouncer.with('ProjectPolicy').authorize('isMember', project, i18n)
    await header.delete()
    Ws.io.emit(`response:${res.id}`, `headers`)
    return response.ok({
      message: i18n.formatMessage('responses.header.delete.header_deleted'),
    })
  }

  // Helper functions

  async #getProjectByHeader(id: string) {
    const header = await Header.findOrFail(id)
    const res = await Response.findOrFail(header.responseId)
    const route = await Route.findOrFail(res.routeId)
    const project = await Project.findOrFail(route.projectId)
    return { header, res, route, project }
  }

  async #getProjectByResponse(id: string) {
    const res = await Response.findOrFail(id)
    const route = await Route.findOrFail(res.routeId)
    const project = await Project.findOrFail(route.projectId)
    return { res, route, project }
  }
}
