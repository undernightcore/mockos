import SwaggerParser from '@apidevtools/swagger-parser'
import { parseFromJsonOrYaml } from 'App/Helpers/Shared/string.helper'

export async function parseSwagger(value: string) {
  const swagger = parseFromJsonOrYaml(value)
  await SwaggerParser.validate(swagger)
  return { raw: value, parsed: swagger }
}
