import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Route from 'App/Models/Route'
import CreateResponseValidator from 'App/Validators/Response/CreateResponseValidator'
import Database from '@ioc:Adonis/Lucid/Database'
import Response from 'App/Models/Response'
import EditResponseValidator from 'App/Validators/Response/EditResponseValidator'
import Ws from 'App/Services/Ws'

export default class ResponsesController {
  public async create({ request, response, auth, bouncer, params }: HttpContextContract) {
    await auth.authenticate()
    const data = await request.validate(CreateResponseValidator)
    const route = await Route.findOrFail(params.id)
    await route.load('project')
    await bouncer.with('ProjectPolicy').authorize('isMember', route.project)
    await Database.transaction(async (trx) => {
      route.useTransaction(trx)
      if (data.enabled) await route.related('responses').query().update('enabled', false)
      await route.related('responses').create(data)
      await trx.commit()
    })
    Ws.io.emit(`route:${route.id}`, 'updated')
    return response.created({ message: 'Se ha creado la respuesta' })
  }

  public async getList({ request, response, auth, bouncer, params }: HttpContextContract) {
    await auth.authenticate()
    const route = await Route.findOrFail(params.id)
    await route.load('project')
    const page = request.input('page', 1)
    const perPage = request.input('perPage', 10)
    await bouncer.with('ProjectPolicy').authorize('isMember', route.project)
    const responses = await route
      .related('responses')
      .query()
      .orderBy('enabled', 'desc')
      .orderBy('created_at', 'desc')
      .paginate(page, perPage)
    return response.ok(responses)
  }

  public async get({ response, auth, bouncer, params }: HttpContextContract) {
    await auth.authenticate()
    const routeResponse = await Response.findOrFail(params.id)
    await routeResponse.load('route')
    const route = routeResponse.route
    await route.load('project')
    const project = route.project
    await bouncer.with('ProjectPolicy').authorize('isMember', project)
    return response.ok(routeResponse)
  }

  public async edit({ request, response, auth, bouncer, params }: HttpContextContract) {
    await auth.authenticate()
    const data = await request.validate(EditResponseValidator)
    const routeResponse = await Response.findOrFail(params.id)
    await routeResponse.load('route')
    const route = routeResponse.route
    await route.load('project')
    const project = route.project
    await bouncer.with('ProjectPolicy').authorize('isMember', project)
    await Database.transaction(async (trx) => {
      await route.useTransaction(trx)
      await routeResponse.useTransaction(trx)
      if (data.enabled) await route.related('responses').query().update('enabled', false)
      await routeResponse.merge(data).save()
      await trx.commit()
    })
    Ws.io.emit(`route:${route.id}`, 'updated')
    Ws.io.emit(`response:${routeResponse.id}`, 'updated')
    return response.ok({ message: 'Se ha actualizado la respuesta' })
  }

  public async delete({ response, auth, bouncer, params }: HttpContextContract) {
    await auth.authenticate()
    const routeResponse = await Response.findOrFail(params.id)
    await routeResponse.load('route')
    const route = routeResponse.route
    await route.load('project')
    const project = route.project
    await bouncer.with('ProjectPolicy').authorize('isMember', project)
    await routeResponse.delete()
    Ws.io.emit(`route:${route.id}`, 'updated')
    Ws.io.emit(`response:${routeResponse.id}`, 'deleted')
    return response.ok({ message: 'Se ha eliminado la respuesta' })
  }
}
