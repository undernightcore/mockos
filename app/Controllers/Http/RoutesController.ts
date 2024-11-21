import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Project from 'App/Models/Project'
import Route from 'App/Models/Route'
import CreateRouteValidator from 'App/Validators/Route/CreateRouteValidator'
import EditRouteValidator from 'App/Validators/Route/EditRouteValidator'
import Database from '@ioc:Adonis/Lucid/Database'
import Ws from 'App/Services/Ws'
import { recalculateRouteOrder } from 'App/Helpers/Shared/sort.helper'
import { getLastIndex } from 'App/Helpers/Shared/array.helper'
import { HttpError } from 'App/Models/HttpError'
import EditFolderValidator from 'App/Validators/Route/EditFolderValidator'
import MoveAndSortValidator from 'App/Validators/Route/MoveAndSortValidator'

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

  public async moveAndSort({
    auth,
    params,
    request,
    response,
    bouncer,
    i18n,
  }: HttpContextContract) {
    await auth.authenticate()

    const project = await Project.findOrFail(params.id)
    await bouncer.with('ProjectPolicy').authorize('isMember', project, i18n)

    const data = await request.validate(MoveAndSortValidator)

    const what = await Route.findOrFail(data.what)
    if (what.isFolder && data.into !== null)
      throw new HttpError(400, i18n.formatMessage('responses.route.moveandsort.folder_in_folder'))

    await Database.transaction(
      async (trx) => {
        const routes = await project.related('routes').query().useTransaction(trx)

        const whatIndex = routes.findIndex((route) => route.id === data.what)
        if (whatIndex === -1)
          throw new HttpError(500, i18n.formatMessage('responses.route.moveandsort.missing_data'))
        const what = routes.splice(whatIndex, 1)[0]

        const siblingIndex =
          data.before !== null
            ? routes.findIndex((route) => route.id === data.before)
            : data.into === null
            ? routes.length
            : routes.reduce(
                (last, current, index) =>
                  current.id === data.into || current.parentFolderId === data.into ? index + 1 : last,
                -1
              )

        if (siblingIndex === -1)
          throw new HttpError(500, i18n.formatMessage('responses.route.moveandsort.missing_data'))

        routes.splice(siblingIndex, 0, what)

        what.parentFolderId = data.into

        await recalculateRouteOrder(routes, trx)
      }
    )

    Ws.io.emit(`project:${project.id}`, `updated`)
    return response.ok({ message: i18n.formatMessage('responses.route.moveandsort.successfully') })
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
}
