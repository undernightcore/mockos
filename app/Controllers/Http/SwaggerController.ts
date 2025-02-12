import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import ImportSwaggerValidator from 'App/Validators/Swagger/ImportSwaggerValidator'
import { parseSwagger } from 'App/SwaggerParser/SwaggerParser'
import { ParsedRouteInterface } from 'App/Interfaces/RouteInterface'
import Database, { TransactionClientContract } from '@ioc:Adonis/Lucid/Database'
import Project from 'App/Models/Project'
import Route from 'App/Models/Route'
import { ParsedResponseInterface } from 'App/Interfaces/ResponseInterface'
import Ws from 'App/Services/Ws'
import Response from 'App/Models/Response'
import { ParsedHeaderInterface } from 'App/Interfaces/HeaderInterface'
import Header from 'App/Models/Header'
import { toMap } from 'App/Helpers/Shared/array.helper'

export default class SwaggerController {
  public async parse({ auth, params, request, response, i18n }: HttpContextContract) {
    await auth.authenticate()

    const data = await request.validate(ImportSwaggerValidator)

    const result = await parseSwagger(data.swagger, data.basePath)

    await this.insertRoutes(result, params.id, data.reset)

    Ws.io.emit(`project:${params.id}`, `updated`)

    return response.created({ message: i18n.formatMessage('responses.swagger.parse.success') })
  }

  private async insertRoutes(routes: ParsedRouteInterface[], projectId: number, reset: boolean) {
    const project = await Project.findOrFail(projectId)

    await Database.transaction(
      async (trx) => {
        if (reset) {
          await Route.query().where('projectId', project.id).useTransaction(trx).delete()
        }

        const existingRoutes = await project.related('routes').query().useTransaction(trx)
        const existingEndpoints = toMap(
          existingRoutes,
          (route) => `${route.method} ${this.normalizeEndpoint(route.endpoint)}`
        )

        const parsedNewRoutes = routes.filter(
          (route) =>
            !existingEndpoints.has(`${route.method} ${this.normalizeEndpoint(route.endpoint)}`)
        )
        const parsedExistingRoutes = routes
          .map((route) => ({
            id: existingEndpoints.get(`${route.method} ${this.normalizeEndpoint(route.endpoint)}`)
              ?.id,
            ...route,
          }))
          .filter((route) => route.id !== undefined)

        const lastOrder = await project
          .related('routes')
          .query()
          .useTransaction(trx)
          .orderBy('order', 'desc')
          .first()

        await Promise.all(
          parsedNewRoutes.map(async (route, index) => {
            const newRoute = await project
              .related('routes')
              .create(
                { ...route, enabled: true, order: (lastOrder?.order ?? 0) + index + 1 },
                { client: trx }
              )

            if (route.responses && route.responses.length > 0) {
              await this.insertResponses(newRoute.id, route.responses, trx, true)
            }
          })
        )

        await Promise.all(
          parsedExistingRoutes.map(async (route) => {
            if (route.id !== undefined && route.responses && route.responses.length > 0) {
              await this.insertResponses(route.id, route.responses, trx, false)
            }
          })
        )
      },
      { isolationLevel: 'repeatable read' }
    )
  }

  private async insertResponses(
    routeId: number,
    responses: ParsedResponseInterface[],
    trx: TransactionClientContract,
    enabled: boolean
  ) {
    await Promise.all(
      responses.map(async (response, index) => {
        const newResponse = await Response.create(
          {
            ...response,
            name: `${response.name} - Imported from Swagger ${new Date().getTime()}`,
            routeId,
            isFile: false,
            enabled: index === 0 && enabled,
            body: response.body,
          },
          { client: trx }
        )

        if (response.headers && response.headers.length > 0) {
          await this.insertHeaders(response.headers, newResponse.id, trx)
        }
      })
    )
  }

  private async insertHeaders(
    headers: ParsedHeaderInterface[],
    responseId: number,
    trx: TransactionClientContract
  ) {
    await Header.createMany(
      headers.map((header) => ({ ...header, responseId })),
      { client: trx }
    )
  }

  private normalizeEndpoint(endpoint: string): string {
    return endpoint.replace(/{[^}]+}/g, '{param}')
  }
}
