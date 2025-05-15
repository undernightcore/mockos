import openAPI from '@apidevtools/swagger-parser'
import { faker } from '@faker-js/faker'
import {
  BuildHeader,
  BuildHTTPRoute,
  BuildRouteResponse,
  getRandomEnumValue,
  Header,
  Methods,
  Route,
  RouteResponse,
} from 'App/Helpers/Swagger/common/common'
import { mapRoute } from 'App/Helpers/Swagger/common/common/utils/mappers'
import { ParsedRouteInterface } from 'App/Interfaces/RouteInterface'
import { load } from 'js-yaml'
import { OpenAPI, OpenAPIV2, OpenAPIV3, OpenAPIV3_1 } from 'openapi-types'
import TagObject = OpenAPIV3_1.TagObject

type SpecificationVersions = 'SWAGGER' | 'OPENAPI_V3'

export function parseSwagger(swagger: string, basePath?: string): Promise<ParsedRouteInterface[]> {
  return convertFromOpenAPI(swagger, basePath)
}

async function convertFromOpenAPI(
  swagger: string,
  basePath?: string
): Promise<ParsedRouteInterface[]> {
  let routes: Route[] = []
  let api: OpenAPIV3.Document | undefined

  try {
    api = JSON.parse(swagger) as OpenAPIV3.Document
  } catch {
    api = load(swagger) as OpenAPIV3.Document
  }

  const parsedAPI: OpenAPI.Document = await openAPI.dereference.bind(openAPI)(api, {
    dereference: { circular: 'ignore' },
  })

  if (isSwagger(parsedAPI)) {
    routes = createRoutes(parsedAPI, 'SWAGGER', basePath)
  } else if (isOpenAPIV3(parsedAPI)) {
    routes = createRoutes(parsedAPI, 'OPENAPI_V3', basePath)
  }

  return routes.map(mapRoute)
}

function createRoutes(parsedAPI: OpenAPIV2.Document, version: 'SWAGGER', basePath?: string): Route[]
function createRoutes(
  parsedAPI: OpenAPIV3.Document,
  version: 'OPENAPI_V3',
  basePath?: string
): Route[]
function createRoutes(
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

            const headers = buildResponseHeaders(contentTypeHeaders, routeResponse.headers)

            if (examples) {
              const routeResponseExamples = parseOpenAPIExamples(examples).map((example) =>
                buildResponse(
                  example.body,
                  example.label,
                  responseStatus === 'default' ? 200 : statusCode,
                  headers
                )
              )
              routeResponses.push(...routeResponseExamples)
            } else if (example) {
              routeResponses.push(
                buildResponse(example, '', responseStatus === 'default' ? 200 : statusCode, headers)
              )
            } else {
              routeResponses.push(
                buildResponse(
                  schema ? generateSchema(schema) : undefined,
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
          endpoint: basePath ? basePath + routePath : routePath,
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
function buildResponseHeaders(
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
          if (responseHeaders[headerName]['example'] !== null) {
            headerValue = responseHeaders[headerName]['example']
          } else if (responseHeaders[headerName]['examples'] !== null) {
            headerValue =
              responseHeaders[headerName]['examples'][
                Object.keys(responseHeaders[headerName]['examples'])[0]
              ]['value']
          } else if (responseHeaders[headerName]['schema'] !== null) {
            headerValue = generateSchema(responseHeaders[headerName]['schema'])
          }
        }

        return BuildHeader(headerName, headerValue)
      }),
    ]
  }

  return [routeContentTypeHeader]
}

function buildResponse(
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
 * Swagger specification type guard
 *
 * @param parsedAPI
 */
function isSwagger(parsedAPI: any): parsedAPI is OpenAPIV2.Document {
  return parsedAPI.swagger !== undefined
}

/**
 * OpenAPI v3 specification type guard
 *
 * @param parsedAPI
 */
function isOpenAPIV3(parsedAPI: any): parsedAPI is OpenAPIV3.Document {
  return parsedAPI.openapi !== undefined && parsedAPI.openapi.startsWith('3.')
}

/**
 * Generate a JSON object from a schema
 *
 */
function generateSchema(schema: OpenAPIV2.SchemaObject | OpenAPIV3.SchemaObject) {
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

    'array': (arraySchema) => {
      const newObject = generateSchema(arraySchema.items)

      return arraySchema.collectionFormat === 'csv' ? newObject : [newObject]
    },
    'object': (objectSchema) => {
      const newObject = {}
      const { properties } = objectSchema

      if (properties) {
        Object.keys(properties).forEach((propertyName) => {
          newObject[propertyName] = generateSchema(properties[propertyName])
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
      if (
        Object.prototype.hasOwnProperty.call(schema, propertyName) &&
        schema[propertyName].length > 0
      ) {
        return generateSchema(schema[propertyName][0])
      }
    }

    // sometimes we have no type but only 'properties' (=object)
    if (!type && schemaToBuild.properties && schemaToBuild.properties instanceof Object) {
      type = 'object'
    }

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
 * @
 */
function parseOpenAPIExamples(examples: OpenAPIV2.ExampleObject | OpenAPIV3.ExampleObject) {
  return Object.entries(examples)
    .map(([label, example]) => ({ label, example }))
    .filter(({ example }) => example?.value?.data)
    .map(({ label, example }) => ({
      body: example.value.data,
      label,
    }))
}
