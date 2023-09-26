import SwaggerParser from '@apidevtools/swagger-parser'
import { isValidJson } from 'App/Helpers/Shared/string.helper'

export async function parseSwagger(value: string) {
  const wasJSON = isValidJson(value)
  const data = await SwaggerParser.validate(value)
  return { data, wasJSON }
}
