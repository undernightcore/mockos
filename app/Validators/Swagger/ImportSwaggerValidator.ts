import { schema, CustomMessages, rules } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class ImportSwaggerValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    reset: schema.boolean(),
    basePath: schema.string.optional({}, [
      rules.regex(new RegExp('^/([a-zA-Z0-9{}-]+)*(/[a-zA-Z0-9{}-]+)*$')),
      rules.maxLength(2000),
    ]),
    swagger: schema.string({}),
  })

  public messages: CustomMessages = this.ctx.i18n.validatorMessages('validator.swagger.parse')
}
