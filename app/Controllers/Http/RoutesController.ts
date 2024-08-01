import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Project from 'App/Models/Project'
import Route from 'App/Models/Route'
import CreateRouteValidator from 'App/Validators/Route/CreateRouteValidator'
import EditRouteValidator from 'App/Validators/Route/EditRouteValidator'
import SortRouteValidator from 'App/Validators/Route/SortRouteValidator'
import Database from '@ioc:Adonis/Lucid/Database'
import Ws from 'App/Services/Ws'
import { recalculateRouteOrder } from 'App/Helpers/Shared/sort.helper'
import { getLastIndex } from 'App/Helpers/Shared/array.helper'
import { HttpError } from 'App/Models/HttpError'
import EditFolderValidator from 'App/Validators/Route/EditFolderValidator'
import MoveRouteValidator from 'App/Validators/Route/MoveRouteValidator'

export default class RoutesController {
  public async create({ request, response, auth, params, bouncer, i18n }: HttpContextContract) {
    await auth.authenticate()
    const project = await Project.findOrFail(params.id)
    const isFolder = Boolean(request.input('isFolder', false))
    await bouncer.with('ProjectPolicy').authorize('isMember', project, i18n)
    const data = await request.validate(CreateRouteValidator)

    const route = await (data.parentFolderId
      ? this.createNewRouteInFolder(project, data.parentFolderId, data)
      : this.createNewRouteInRoot(project, isFolder, data))

    Ws.io.emit(`project:${project.id}`, `updated`)
    return response.created(route)
  }

  public async edit({ request, response, auth, params, bouncer, i18n }: HttpContextContract) {
    await auth.authenticate()
    const route = await Route.findOrFail(params.id)
    const project = await Project.findOrFail(route.projectId)
    params.projectId = route.projectId
    const data = await request.validate(route.isFolder ? EditFolderValidator : EditRouteValidator)
    await bouncer.with('ProjectPolicy').authorize('isMember', project, i18n)
    const newRoute = await route.merge(data).save()
    Ws.io.emit(`project:${project.id}`, `updated`)
    Ws.io.emit(`route:${route.id}`, `updated`)
    return response.ok(newRoute)
  }

  public async delete({ response, auth, params, bouncer, i18n }: HttpContextContract) {
    await auth.authenticate()
    const route = await Route.findOrFail(params.id)
    const project = await Project.findOrFail(route.projectId)
    await bouncer.with('ProjectPolicy').authorize('isMember', project, i18n)
    await Database.transaction(async (trx) => {
      await route.useTransaction(trx)
      await route.delete()
      const routes = await project.related('routes').query().useTransaction(trx).orderBy('order')
      await recalculateRouteOrder(routes, trx)
    })
    Ws.io.emit(`project:${project.id}`, `updated`)
    Ws.io.emit(`route:${route.id}`, `deleted`)
    return response.ok({ message: i18n.formatMessage('responses.route.delete.route_deleted') })
  }

  public async get({ response, auth, params, bouncer, i18n }: HttpContextContract) {
    await auth.authenticate()
    const route = await Route.findOrFail(params.id)
    const project = await Project.findOrFail(route.projectId)
    await bouncer.with('ProjectPolicy').authorize('isMember', project, i18n)
    return response.ok(route)
  }

  public async getList({ response, auth, params, bouncer, i18n }: HttpContextContract) {
    await auth.authenticate()
    const project = await Project.findOrFail(params.id)
    await bouncer.with('ProjectPolicy').authorize('isMember', project, i18n)
    const routes = await project.related('routes').query().orderBy('order')
    return response.ok(routes)
  }

  public async sort({ auth, params, request, response, bouncer, i18n }: HttpContextContract) {
    await auth.authenticate()
    const data = await request.validate(SortRouteValidator)
    const project = await Project.findOrFail(params.id)
    await bouncer.with('ProjectPolicy').authorize('isMember', project, i18n)

    if (data.origin !== data.destination) {
      const fromRoute = await Route.findOrFail(data.origin)
      const toRoute = await Route.findOrFail(data.destination)

      const sameProject = fromRoute.projectId === project.id && toRoute.projectId === project.id
      const sameDepth = fromRoute.parentFolderId === toRoute.parentFolderId
      if (!sameProject)
        throw new HttpError(400, i18n.formatMessage('responses.route.sort.route_mismatch'))
      if (!sameDepth)
        throw new HttpError(400, i18n.formatMessage('responses.route.sort.context_mismatch'))

      await Database.transaction(async (trx) => {
        const routes = await project.related('routes').query().useTransaction(trx).orderBy('order')
        this.sortRoutes(routes, fromRoute, toRoute)
        await recalculateRouteOrder(routes, trx)
      })

      Ws.io.emit(`project:${project.id}`, `updated`)
    }

    return response.ok({ message: i18n.formatMessage('responses.route.sort.route_sorted') })
  }

  public async move({ auth, params, request, response, bouncer, i18n }: HttpContextContract) {
    await auth.authenticate()
    const data = await request.validate(MoveRouteValidator)
    const project = await Project.findOrFail(params.id)
    await bouncer.with('ProjectPolicy').authorize('isMember', project, i18n)

    await Database.transaction(async (trx) => {
      const routes = await project.related('routes').query().useTransaction(trx).orderBy('order')
      const fromIndex = routes.findIndex((route) => route.id === data.origin)
      const movingRoute = routes.splice(fromIndex, 1)[0]
      movingRoute.parentFolderId = data.destination

      if (data.destination !== null) {
        const toIndex = getLastIndex(
          routes,
          (route: Route) =>
            route.parentFolderId === data.destination || route.id === data.destination
        )
        routes.splice(toIndex + 1, 0, movingRoute)
      } else {
        routes.push(movingRoute)
      }

      await recalculateRouteOrder(routes, trx)
    })

    Ws.io.emit(`project:${project.id}`, `updated`)
    return response.ok({ message: i18n.formatMessage('responses.route.move.route_moved') })
  }

  // Helper functions

  private async createNewRouteInRoot(
    project: Project,
    isFolder: boolean,
    data: { [p: string]: any }
  ) {
    const lastOrder = await project.related('routes').query().orderBy('order', 'desc').first()
    return project
      .related('routes')
      .create({ ...data, isFolder, order: (lastOrder?.order ?? 0) + 1 })
  }

  private async createNewRouteInFolder(
    project: Project,
    parentFolderId: number,
    data: { [p: string]: any }
  ) {
    return Database.transaction(async (trx) => {
      const newRoute = new Route().fill({
        ...data,
        isFolder: false,
        projectId: project.id,
        parentFolderId: parentFolderId,
      })
      const allRoutes = await project.related('routes').query().useTransaction(trx).orderBy('order')
      const lastFolderChildIndex = getLastIndex(
        allRoutes,
        (route: Route) => route.parentFolderId === parentFolderId || route.id === parentFolderId
      )
      allRoutes.splice(lastFolderChildIndex + 1, 0, newRoute)
      await recalculateRouteOrder(allRoutes, trx)
      return newRoute
    })
  }

  private sortRoutes(allRoutes: Route[], fromRoute: Route, toRoute: Route) {
    const fromIndex = allRoutes.findIndex((route) => route.id === fromRoute.id)
    const fromRelatedRoutesAmount = allRoutes.reduce(
      (acc, route) => (route.parentFolderId === fromRoute.id ? acc + 1 : acc),
      1
    )

    const movingRoutes = allRoutes.splice(fromIndex, fromRelatedRoutesAmount)

    const toIndex = allRoutes.findIndex((route) => route.id === toRoute.id)
    const toRelatedRoutesAmount = allRoutes.reduce(
      (acc, route) => (route.parentFolderId === toRoute.id ? acc + 1 : acc),
      1
    )

    const placeAfter = fromRoute.order < toRoute.order
    allRoutes.splice(toIndex + (placeAfter ? toRelatedRoutesAmount : 0), 0, ...movingRoutes)
  }
}
