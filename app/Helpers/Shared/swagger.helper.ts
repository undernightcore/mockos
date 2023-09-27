import SwaggerParser from '@apidevtools/swagger-parser'
import { parseJsonIfPossible } from 'App/Helpers/Shared/string.helper'
import { OpenAPI } from 'openapi-types'
import { dump } from 'js-yaml'

export async function parseSwagger(value: string) {
  const swagger = parseJsonIfPossible(value)
  const data = await SwaggerParser.validate(swagger)
  return { data, isJSON: typeof swagger === 'object' }
}

export function stringifySwagger(value: OpenAPI.Document<{}>, toJSON: boolean) {
  return toJSON ? JSON.stringify(value) : dump(value)
}
