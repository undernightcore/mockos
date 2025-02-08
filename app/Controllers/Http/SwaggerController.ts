import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import ImportSwaggerValidator from 'App/Validators/Swagger/ImportSwaggerValidator'
import { parseSwagger } from 'App/SwaggerParser/SwaggerParser'
import { RouteInterface } from 'App/Interfaces/RouteInterface'
import Database from '@ioc:Adonis/Lucid/Database'
import Project from 'App/Models/Project'
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
    await this.insertRoutes(result, params.id)

    Ws.io.emit(`project:${params.id}`, `updated`)
    return response.created(result)
  }

  private async insertRoutes(routes: RouteInterface[], projectId: number) {
    const project = await Project.findOrFail(projectId)
    const regularRoutes = routes.filter((route) => !route.isFolder)

    await Database.transaction(async (trx) => {
      const existingRoutes = await Route.query().useTransaction(trx)
      const existingEndpoints = new Set(
        existingRoutes.map((route) => this.normalizeEndpoint(route.endpoint))
      )

      const newRoutes: RouteInterface[] = []
      const parsedExistingRoutes: RouteInterface[] = []

      regularRoutes.forEach((route) => {
        if (existingEndpoints.has(route.endpoint)) {
          parsedExistingRoutes.push(route)
        } else {
          newRoutes.push(route)
        }
      })

      await Promise.all(
        newRoutes.map(async (routeData) => {
          const newRoute = await this.createNewRouteInRoot(project, false, routeData, trx)
          if (routeData.responses && routeData.responses.length > 0) {
            await this.insertResponses(newRoute.id, routeData.responses, false, trx)
          }
        })
      )

      await Promise.all(
        parsedExistingRoutes.map(async (routeData) => {
          if (routeData.responses && routeData.responses.length > 0) {
            await this.insertResponses(routeData.id, routeData.responses, false, trx)
          }
        })
      )
    })
  }

  private async insertResponses(
    routeId: number,
    responses: ResponseInterface[],
    isFile: boolean,
    trx: any
  ) {
    await Promise.all(
      responses.map(async (response) => {
        const newResponse = await Response.create(
          { ...response, isFile, routeId, body: response.body },
          { client: trx }
        )

        if (response.headers && response.headers.length > 0) {
          await this.insertHeaders(response.headers, newResponse.id, trx)
        }
      })
    )
  }

  private async insertHeaders(headers: HeaderInterface[], responseId: number, trx: any) {
    if (headers.length > 0) {
      await Header.createMany(
        headers.map((header) => ({ ...header, responseId })),
        { client: trx }
      )
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

  private normalizeEndpoint(endpoint: string): string {
    return endpoint.replace(/{[^}]+}/g, '{param}')
  }
}
