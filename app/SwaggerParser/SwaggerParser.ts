import openAPI from '@apidevtools/swagger-parser'
import { OpenAPI, OpenAPIV2, OpenAPIV3, OpenAPIV3_1 } from 'openapi-types'
import { faker } from '@faker-js/faker'
import TagObject = OpenAPIV3_1.TagObject
import { ParsedRouteInterface } from 'App/Interfaces/RouteInterface'
import {
  BuildHeader,
  BuildHTTPRoute,
  BuildRouteResponse,
  getRandomEnumValue,
  Header,
  Methods,
  Route,
  RouteResponse,
} from 'App/SwaggerParser/common/common'
import { mapRoute } from 'App/SwaggerParser/common/common/utils/mappers'
import { load } from 'js-yaml'

type SpecificationVersions = 'SWAGGER' | 'OPENAPI_V3'

export function parseSwagger(swagger: string, basePath?: string): Promise<ParsedRouteInterface[]> {
  return new OpenAPIConverter().convertFromOpenAPI(swagger, basePath)
}

class OpenAPIConverter {
  public async convertFromOpenAPI(
    swagger: string,
    basePath?: string
  ): Promise<ParsedRouteInterface[]> {
    let routes: Route[] = []
    let api: OpenAPIV3.Document | undefined = undefined

    try {
      api = JSON.parse(swagger) as OpenAPIV3.Document
    } catch {
      api = load(swagger) as OpenAPIV3.Document
    }

    const parsedAPI: OpenAPI.Document = await openAPI.dereference.bind(openAPI)(api, {
      dereference: { circular: 'ignore' },
    })

    if (this.isSwagger(parsedAPI)) {
      routes = this.createRoutes(parsedAPI, 'SWAGGER', basePath)
    } else if (this.isOpenAPIV3(parsedAPI)) {
      routes = this.createRoutes(parsedAPI, 'OPENAPI_V3', basePath)
    }

    return routes.map(mapRoute)
  }

  private createRoutes(
    parsedAPI: OpenAPIV2.Document,
    version: 'SWAGGER',
    basePath?: string
  ): Route[]
  private createRoutes(
    parsedAPI: OpenAPIV3.Document,
    version: 'OPENAPI_V3',
    basePath?: string
  ): Route[]
  private createRoutes(
    parsedAPI: OpenAPIV2.Document & OpenAPIV3.Document,
    version: SpecificationVersions,
    basePath?: string
  ): Route[] {
    const routes: Route[] = []
    const tags: TagObject[] = parsedAPI.tags ?? []

    Object.keys(parsedAPI.paths).forEach((routePath) => {
      Object.keys(parsedAPI.paths[routePath]).forEach((routeMethod) => {
        const parsedRoute: OpenAPIV2.OperationObject & OpenAPIV3.OperationObject =
          parsedAPI.paths[routePath][routeMethod]

        if (routeMethod in Methods) {
          const routeResponses: RouteResponse[] = []

          Object.keys(parsedRoute.responses).forEach((responseStatus) => {
            const statusCode = parseInt(responseStatus, 10)

            if ((statusCode >= 100 && statusCode <= 999) || responseStatus === 'default') {
              const routeResponse: OpenAPIV2.ResponseObject & OpenAPIV3.ResponseObject = parsedRoute
                .responses[responseStatus] as OpenAPIV2.ResponseObject & OpenAPIV3.ResponseObject

              let contentTypeHeaders: string[] = []
              let schema: OpenAPIV2.SchemaObject | OpenAPIV3.SchemaObject | undefined
              let examples: OpenAPIV2.ExampleObject | OpenAPIV3.ExampleObject | undefined
              let example: OpenAPIV2.ExampleObject | OpenAPIV3.ExampleObject | undefined

              if (version === 'SWAGGER') {
                contentTypeHeaders =
                  parsedRoute.produces ??
                  parsedRoute.consumes ??
                  parsedAPI.produces ??
                  parsedAPI.consumes ??
                  []
              } else if (version === 'OPENAPI_V3' && routeResponse.content) {
                contentTypeHeaders = Object.keys(routeResponse.content)
              }

              const contentTypeHeader = contentTypeHeaders.find((header) =>
                header.includes('application/json')
              )

              if (contentTypeHeader) {
                if (version === 'SWAGGER') {
                  schema = routeResponse.schema
                  examples = routeResponse.examples
                } else if (version === 'OPENAPI_V3') {
                  schema = routeResponse.content?.[contentTypeHeader].schema
                  examples = routeResponse.content?.[contentTypeHeader].examples
                  example = routeResponse.content?.[contentTypeHeader].example
                }
              }

              const headers = this.buildResponseHeaders(contentTypeHeaders, routeResponse.headers)

              if (examples) {
                const routeResponseExamples = this.parseOpenAPIExamples(examples).map((example) =>
                  this.buildResponse(
                    example.body,
                    example.label,
                    responseStatus === 'default' ? 200 : statusCode,
                    headers
                  )
                )
                routeResponses.push(...routeResponseExamples)
              } else if (example) {
                routeResponses.push(
                  this.buildResponse(
                    example,
                    '',
                    responseStatus === 'default' ? 200 : statusCode,
                    headers
                  )
                )
              } else {
                routeResponses.push(
                  this.buildResponse(
                    schema ? this.generateSchema(schema) : undefined,
                    routeResponse.description || '',
                    responseStatus === 'default' ? 200 : statusCode,
                    headers
                  )
                )
              }
            }
          })

          if (!routeResponses.length) {
            routeResponses.push({
              ...BuildRouteResponse(),
              headers: [BuildHeader('Content-Type', 'application/json')],
              body: '',
            })
          }

          routeResponses[0].default = true

          const newRoute: Route = {
            ...BuildHTTPRoute(false),
            name: parsedRoute.operationId || '',
            documentation: parsedRoute.summary || parsedRoute.description || '',
            method: routeMethod as Methods,
            endpoint: this.v2ParametersReplace(basePath ? basePath + routePath : routePath),
            responses: routeResponses,
            tags: tags.map((tag) => tag.name),
          }

          routes.push(newRoute)
        }
      })
    })

    return routes
  }

  /**
   * Build route response headers from 'content' (v3) or 'produces' (v2), and 'headers' objects
   *
   * @param contentTypes
   * @param responseHeaders
   */
  private buildResponseHeaders(
    contentTypes: string[],
    responseHeaders:
      | undefined
      | OpenAPIV2.HeadersObject
      | Record<string, OpenAPIV3.ReferenceObject | OpenAPIV3.HeaderObject>
  ): Header[] {
    const routeContentTypeHeader = BuildHeader('Content-Type', 'application/json')

    if (contentTypes?.length && !contentTypes.includes('application/json')) {
      routeContentTypeHeader.value = contentTypes[0]
    }

    if (responseHeaders) {
      return [
        routeContentTypeHeader,
        ...Object.keys(responseHeaders).map((headerName) => {
          let headerValue = ''

          if (responseHeaders[headerName] !== null) {
            // @ts-ignore
            if (responseHeaders[headerName]['example'] !== null) {
              // @ts-ignore
              headerValue = responseHeaders[headerName]['example']
              // @ts-ignore
            } else if (responseHeaders[headerName]['examples'] !== null) {
              headerValue =
                // @ts-ignore
                responseHeaders[headerName]['examples'][
                  Object.keys(responseHeaders[headerName]['examples'])[0]
                ]['value']
              // @ts-ignore
            } else if (responseHeaders[headerName]['schema'] !== null) {
              // @ts-ignore
              headerValue = this.generateSchema(responseHeaders[headerName]['schema'])
            }
          }

          return BuildHeader(headerName, headerValue)
        }),
      ]
    }

    return [routeContentTypeHeader]
  }

  private buildResponse(
    body: object | undefined,
    label: string,
    statusCode: number,
    headers: Header[]
  ) {
    return {
      ...BuildRouteResponse(),
      body: body ?? '',
      label,
      statusCode,
      headers,
    }
  }

  /**
   * Replace parameters in `str`
   *
   * @param str
   */
  private v2ParametersReplace(str: string) {
    return str.replace(/{(\w+)}/gi, (_searchValue, _replaceValue) => `{param}`)
  }

  /**
   * Swagger specification type guard
   *
   * @param parsedAPI
   */
  private isSwagger(parsedAPI: any): parsedAPI is OpenAPIV2.Document {
    return parsedAPI.swagger !== undefined
  }

  /**
   * OpenAPI v3 specification type guard
   *
   * @param parsedAPI
   */
  private isOpenAPIV3(parsedAPI: any): parsedAPI is OpenAPIV3.Document {
    return parsedAPI.openapi !== undefined && parsedAPI.openapi.startsWith('3.')
  }

  /**
   * Generate a JSON object from a schema
   *
   */
  // @ts-ignore
  private generateSchema(schema: OpenAPIV2.SchemaObject | OpenAPIV3.SchemaObject) {
    const typeFactories = {
      'integer': () => faker.number.int({ max: 99999 }),
      'number': () => faker.number.int({ max: 99999 }),
      'number_float': () => faker.number.float({ fractionDigits: 2 }),
      'number_double': () => faker.number.float({ fractionDigits: 2 }),
      'string': () => faker.string.alpha({ length: { min: 1, max: 15 } }),
      'string_date': () => faker.date.between({ from: '2024-01-01', to: Date.now() }),
      'string_date-time': () => faker.date.between({ from: '2024-01-01', to: Date.now() }),
      'string_email': () => faker.internet.email(),
      'string_uuid': () => faker.string.uuid(),
      'boolean': () => faker.datatype.boolean(),
      // @ts-ignore
      'array': (arraySchema) => {
        // @ts-ignore
        const newObject = this.generateSchema(arraySchema.items)

        return arraySchema.collectionFormat === 'csv' ? newObject : [newObject]
      },
      // @ts-ignore
      'object': (objectSchema) => {
        const newObject = {}
        const { properties } = objectSchema

        if (properties) {
          Object.keys(properties).forEach((propertyName) => {
            // @ts-ignore
            newObject[propertyName] = this.generateSchema(properties[propertyName])
          })
        }

        return newObject
      },
    }

    if (schema instanceof Object) {
      let type: string =
        Array.isArray(schema.type) && schema.type.length >= 1
          ? schema.type[0]
          : (schema.type as string)

      // use enum property if present
      if (schema.enum) {
        return getRandomEnumValue(schema.enum)
      }

      // return example if any
      if (schema.example) {
        return schema.example
      }

      // return default value if any
      if (schema.default) {
        return schema.default
      }

      const schemaToBuild = schema

      // check if we have an array of schemas, and take first item
      for (const propertyName of ['allOf', 'oneOf', 'anyOf']) {
        // @ts-ignore
        if (
          Object.prototype.hasOwnProperty.call(schema, propertyName) &&
          schema[propertyName].length > 0
        ) {
          // @ts-ignore
          return this.generateSchema(schema[propertyName][0])
        }
      }

      // sometimes we have no type but only 'properties' (=object)
      if (!type && schemaToBuild.properties && schemaToBuild.properties instanceof Object) {
        type = 'object'
      }

      // @ts-ignore
      const typeFactory = typeFactories[`${type}_${schemaToBuild.format}`] || typeFactories[type]

      if (typeFactory) {
        return typeFactory(schemaToBuild)
      }

      return ''
    }
  }

  /**
   * Extract bodies and labels from OpenAPI examples
   * @param examples
   * @private
   */
  private parseOpenAPIExamples(examples: any) {
    const responses: { label: string; body: any }[] = []

    examples?.forEach((example: OpenAPIV2.ExampleObject | OpenAPIV3.ExampleObject) => {
      const exampleResponse = {
        body: example,
        label: '',
      }

      responses.push(exampleResponse)
    })

    return responses
  }
}
