import { schema, CustomMessages } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class ImportSwaggerValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    basePath: schema.string.nullable({}),
    swagger: schema.string({}),
  })

  public messages: CustomMessages = this.ctx.i18n.validatorMessages('validator.swagger.parse')
}
