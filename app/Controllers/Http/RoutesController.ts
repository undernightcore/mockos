import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Project from 'App/Models/Project'
import Route from 'App/Models/Route'
import CreateRouteValidator from 'App/Validators/Route/CreateRouteValidator'
import EditRouteValidator from 'App/Validators/Route/EditRouteValidator'
import SortRouteValidator from 'App/Validators/Route/SortRouteValidator'
import Database from '@ioc:Adonis/Lucid/Database'
import { move } from 'App/Helpers/array.helper'
import { recalculateRouteOrder } from 'App/Helpers/sort.helper'

export default class RoutesController {
  public async create({ request, response, auth, params, bouncer }: HttpContextContract) {
    await auth.authenticate()
    const project = await Project.findOrFail(params.id)
    await bouncer.with('ProjectPolicy').authorize('isMember', project)
    const data = await request.validate(CreateRouteValidator)
    const lastOrder = await project.related('routes').query().orderBy('order', 'desc').first()
    const route = await project
      .related('routes')
      .create({ ...data, order: (lastOrder?.order ?? 0) + 1 })
    return response.created(route)
  }

  public async edit({ request, response, auth, params, bouncer }: HttpContextContract) {
    await auth.authenticate()
    const route = await Route.findOrFail(params.id)
    const project = await Project.findOrFail(route.projectId)
    params.projectId = route.projectId
    const data = await request.validate(EditRouteValidator)
    await bouncer.with('ProjectPolicy').authorize('isMember', project)
    const newRoute = await route.merge(data).save()
    return response.ok(newRoute)
  }

  public async delete({ response, auth, params, bouncer }: HttpContextContract) {
    await auth.authenticate()
    const route = await Route.findOrFail(params.id)
    const project = await Project.findOrFail(route.projectId)
    await bouncer.with('ProjectPolicy').authorize('isMember', project)
    await Database.transaction(async (trx) => {
      await route.useTransaction(trx)
      await route.delete()
      const routes = await project.related('routes').query().useTransaction(trx).orderBy('order')
      await recalculateRouteOrder(routes, trx)
      await trx.commit()
    })
    return response.ok({ message: 'Se ha eliminado la ruta correctamente' })
  }

  public async get({ response, auth, params, bouncer }: HttpContextContract) {
    await auth.authenticate()
    const route = await Route.findOrFail(params.id)
    const project = await Project.findOrFail(route.projectId)
    await bouncer.with('ProjectPolicy').authorize('isMember', project)
    return response.ok(route)
  }

  public async getList({ response, request, auth, params, bouncer }: HttpContextContract) {
    await auth.authenticate()
    const project = await Project.findOrFail(params.id)
    const page = await request.input('page')
    const perPage = await request.input('perPage')
    const search = await request.input('search')
    await bouncer.with('ProjectPolicy').authorize('isMember', project)
    const routes = await project
      .related('routes')
      .query()
      .orderBy('order')
      .whereILike('name', `%${search ?? ''}%`)
      .orWhereILike('endpoint', `%${search ?? ''}%`)
      .paginate(page ?? 1, perPage ?? 10)
    return response.ok(routes)
  }

  public async sort({ auth, params, request, response }: HttpContextContract) {
    await auth.authenticate()
    const data = await request.validate(SortRouteValidator)
    const project = await Project.findOrFail(params.id)
    const fromRoute = await Route.findOrFail(data.origin)
    const toRoute = await Route.findOrFail(data.destination)
    const sameProject = fromRoute.projectId === project.id && toRoute.projectId === project.id
    if (!sameProject)
      return response
        .status(400)
        .json({ errors: ['Las rutas no corresponden al projecto correcto'] })
    await Database.transaction(async (trx) => {
      const routes = await project.related('routes').query().useTransaction(trx).orderBy('order')
      const fromIndex = routes.findIndex((route) => route.id === fromRoute.id)
      const toIndex = routes.findIndex((route) => route.id === toRoute.id)
      move(routes, fromIndex, toIndex)
      await recalculateRouteOrder(routes, trx)
      await trx.commit()
    })
    return response.ok({ message: 'Se ha movido correctamente' })
  }
}
