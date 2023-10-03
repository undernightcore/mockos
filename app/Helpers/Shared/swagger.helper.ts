import SwaggerParser from '@apidevtools/swagger-parser'
import { parseFromJsonOnYaml } from 'App/Helpers/Shared/string.helper'
import { OpenAPI } from 'openapi-types'
import { dump } from 'js-yaml'

export async function parseSwagger(value: string) {
  const swagger = parseFromJsonOnYaml(value)
  const data = await SwaggerParser.validate(swagger.value)
  return { data, isJSON: swagger.wasJSON }
}

export function stringifySwagger(value: OpenAPI.Document<{}>, toJSON: boolean) {
  return toJSON ? JSON.stringify(value, null, 2) : dump(value)
}
