import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import ImportSwaggerValidator from 'App/Validators/Swagger/ImportSwaggerValidator'
import { parseSwagger } from 'App/SwaggerParser/SwaggerParser'
//import { swaggerMock } from 'App/SwaggerParser/mocks'

export default class SwaggerController {
  public async parse({ request, response }: HttpContextContract) {
    const data = await request.validate(ImportSwaggerValidator)

    const result = await parseSwagger(data.swagger)
    //const resultMock = swaggerMock()

    return response.created(result)
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
