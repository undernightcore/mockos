import SwaggerParser from '@apidevtools/swagger-parser'
import { parseFromJsonOrYaml } from 'App/Helpers/Shared/string.helper'
import { OpenAPI } from 'openapi-types'
import { dump } from 'js-yaml'

export async function parseSwagger(value: string) {
  const swagger = parseFromJsonOrYaml(value)
  await SwaggerParser.validate(swagger.value)
  return { data: JSON.parse(value), isJSON: swagger.wasJSON }
}

export function stringifySwagger(value: OpenAPI.Document<{}>, toJSON: boolean) {
  return toJSON ? JSON.stringify(value, null, 2) : dump(value)
}
