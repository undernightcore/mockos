import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Project from 'App/Models/Project'
import Route from 'App/Models/Route'
import CreateRouteValidator from 'App/Validators/Route/CreateRouteValidator'
import Database from '@ioc:Adonis/Lucid/Database'
import Ws from 'App/Services/Ws'
import { recalculateRouteOrder } from 'App/Helpers/Shared/sort.helper'
import { getLastIndex } from 'App/Helpers/Shared/array.helper'
import { RouteInterface } from 'App/Interfaces/RouteInterface'

export default class RoutesController {
  public async parse({ request, response, auth, params, bouncer, i18n }: HttpContextContract) {
    await auth.authenticate()
    const project = await Project.findOrFail(params.id)
    const isFolder = Boolean(request.input('isFolder', false))
    await bouncer.with('ProjectPolicy').authorize('isMember', project, i18n)
    const data = await request.validate(CreateRouteValidator)
    const routes: RouteInterface[] = [
      {
        id: 1,
        name: 'Test',
        endpoint: '/test',
        method: 'GET',
        enabled: true,
        isFolder: false,
        order: 1,
        responses: [],
        headers: [],
        projectId: 1,
        parentFolderId: null,
      },
    ]

    await this.insertRoutes(routes)

    Ws.io.emit(`project:${project.id}`, `updated`)
    return response.created(routes)
  }

  private async insertRoutes(routes: RouteInterface[]) {
    const folders = routes.filter((route) => route.isFolder)
    const regularRoutes = routes.filter((route) => !route.isFolder)
    await Database.transaction(async (trx) => {
      for (const folderData of folders) {
        const project = await Project.findOrFail(folderData.projectId, { client: trx })
        await this.createNewRouteInRoot(project, true, folderData)
      }

      for (const routeData of regularRoutes) {
        const project = await Project.findOrFail(routeData.projectId, { client: trx })
        if (routeData.parentFolderId) {
          await this.createNewRouteInFolder(project, routeData.parentFolderId, routeData)
        } else {
          await this.createNewRouteInRoot(project, false, routeData)
        }
      }
    })
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
