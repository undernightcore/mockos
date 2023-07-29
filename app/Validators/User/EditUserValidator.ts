import { schema, rules } from '@ioc:Adonis/Core/Validator'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class EditUserValidator {
  constructor(private ctx: HttpContextContract) {}

  public schema = schema.create({
    name: schema.string({}, [rules.minLength(3)]),
  })

  public messages = this.ctx.i18n.validatorMessages('validator.user.edit')
}
