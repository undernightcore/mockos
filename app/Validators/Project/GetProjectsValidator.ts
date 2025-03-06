import { schema } from '@ioc:Adonis/Core/Validator'

export default class GetProjectsValidator {
  public schema = schema.create({
    page: schema.number.optional(),
    perPage: schema.number.optional(),
    sortBy: schema.enum.optional(['created_at', 'updated_at', 'name']),
    onlyBranches: schema.boolean.optional(),
    direction: schema.enum.optional(['desc', 'asc']),
  })
}
