import { schema, CustomMessages, rules } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class CreateTokenValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    name: schema.string({ trim: true }, [rules.minLength(3), rules.maxLength(30)]),
  })

  public messages: CustomMessages = this.ctx.i18n.validatorMessages('validator.token.create')
}
