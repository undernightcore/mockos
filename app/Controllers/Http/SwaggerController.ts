import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import ImportSwaggerValidator from 'App/Validators/Swagger/ImportSwaggerValidator'
import { parseSwagger } from 'App/SwaggerParser/SwaggerParser'
import { RouteInterface } from 'App/Interfaces/RouteInterface'
import Database from '@ioc:Adonis/Lucid/Database'
import Project from 'App/Models/Project'
import { swaggerMock } from 'App/SwaggerParser/mocks'
import Route from 'App/Models/Route'
import { ResponseInterface } from 'App/Interfaces/ResponseInterface'

export default class SwaggerController {
  public async parse({ auth, params, request, response }: HttpContextContract) {
    console.log('PARAMS:', request)
    const data = await request.validate(ImportSwaggerValidator)

    const result = await parseSwagger(data.swagger)
    const resultMock = swaggerMock
    //await this.insertRoutes(resultMock, params.id)

    return response.created(result)
  }

  private async insertRoutes(routes: RouteInterface[], projectId: number) {
    const project = await Project.findOrFail(projectId)
    const regularRoutes = routes.filter((route) => !route.isFolder)

    await Database.transaction(async (trx) => {
      const existingRoutes = await Route.query().useTransaction(trx)
      const existingEndpoints = new Set(existingRoutes.map((route) => route.endpoint))
      const newRoutes = regularRoutes.filter((route) => !existingEndpoints.has(route.endpoint))

      for (const routeData of newRoutes) {
        const newRoute = await this.createNewRouteInRoot(project, false, routeData, trx)
        await this.insertResponses(newRoute.responses, newRoute.id, trx)
      }
    })
  }

  private async insertResponses(responses: ResponseInterface[], routeId: number, trx: any) {}

  // Helper functions
  private async createNewRouteInRoot(
    project: Project,
    isFolder: boolean,
    data: { [p: string]: any },
    trx: any
  ) {
    const lastOrder = await project.related('routes').query().orderBy('order', 'desc').first()
    return project
      .related('routes')
      .create({ ...data, isFolder, order: (lastOrder?.order ?? 0) + 1 }, { client: trx })
  }
}
