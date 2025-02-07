import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import ImportSwaggerValidator from 'App/Validators/Swagger/ImportSwaggerValidator'
import { parseSwagger } from 'App/SwaggerParser/SwaggerParser'
import { RouteInterface } from 'App/Interfaces/RouteInterface'
import Database from '@ioc:Adonis/Lucid/Database'
import Project from 'App/Models/Project'
import { swaggerMock } from 'App/SwaggerParser/mocks'
import Route from 'App/Models/Route'
import { ResponseInterface } from 'App/Interfaces/ResponseInterface'
import Ws from 'App/Services/Ws'
import Response from 'App/Models/Response'
import { HeaderInterface } from 'App/Interfaces/HeaderInterface'
import Header from 'App/Models/Header'

export default class SwaggerController {
  public async parse({ auth, params, request, response }: HttpContextContract) {
    await auth.authenticate()
    const data = await request.validate(ImportSwaggerValidator)

    const result = await parseSwagger(data.swagger)
    const resultMock = swaggerMock
    await this.insertRoutes(resultMock, params.id)

    Ws.io.emit(`project:${params.id}`, `updated`)
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

        if (routeData.responses && routeData.responses.length > 0) {
          await this.insertResponses(newRoute.id, routeData.responses, false, trx)
        }
      }
    })
  }

  private async insertResponses(
    routeId: number,
    responses: ResponseInterface[],
    isFile: boolean,
    trx: any
  ) {
    for (const response of responses) {
      const newResponse = await Response.create(
        { ...response, isFile, routeId, body: response.body },
        { client: trx }
      )

      if (response.headers && response.headers.length > 0) {
        await this.insertHeaders(response.headers, newResponse.id, trx)
      }
    }
  }

  private async insertHeaders(headers: HeaderInterface[], responseId: number, trx: any) {
    for (const header of headers) {
      await Header.create({ ...header, responseId }, { client: trx })
    }
  }

  private async createNewRouteInRoot(
    project: Project,
    isFolder: boolean,
    data: { [p: string]: any },
    trx: any
  ) {
    const lastOrder = await project
      .related('routes')
      .query()
      .useTransaction(trx)
      .orderBy('order', 'desc')
      .first()
    return project
      .related('routes')
      .create({ ...data, isFolder, order: (lastOrder?.order ?? 0) + 1 }, { client: trx })
  }
}
