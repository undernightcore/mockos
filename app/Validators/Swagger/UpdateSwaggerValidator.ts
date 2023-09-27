import { schema, CustomMessages } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class UpdateSwaggerValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    originalVersion: schema.string.nullable({}),
    swagger: schema.string({}),
  })

  public messages: CustomMessages = this.ctx.i18n.validatorMessages('validator.swagger.update')
}
