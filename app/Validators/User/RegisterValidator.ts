import { schema, rules } from '@ioc:Adonis/Core/Validator'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class RegisterValidator {
  constructor(private ctx: HttpContextContract) {}

  public schema = schema.create({
    email: schema.string({}, [rules.email(), rules.unique({ table: 'users', column: 'email' })]),
    name: schema.string({}, [rules.minLength(3)]),
    password: schema.string({}, [rules.minLength(8)]),
  })

  public messages = this.ctx.i18n.validatorMessages('validator.user.register')
}
