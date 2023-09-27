import SwaggerParser from '@apidevtools/swagger-parser'
import { isValidJson } from 'App/Helpers/Shared/string.helper'
import { OpenAPI } from 'openapi-types'
import { dump } from 'js-yaml'

export async function parseSwagger(value: string) {
  const wasJSON = isValidJson(value)
  const data = await SwaggerParser.validate(value)
  return { data, wasJSON }
}

export function stringifySwagger(value: OpenAPI.Document<{}>, toJSON: boolean) {
  return toJSON ? JSON.stringify(value) : dump(value)
}
