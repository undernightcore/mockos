import { schema, rules } from '@ioc:Adonis/Core/Validator'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class CreateProjectValidator {
  constructor(private ctx: HttpContextContract) {}

  public schema = schema.create({
    name: schema.string({}, [
      rules.minLength(3),
      rules.unique({ table: 'projects', column: 'name' }),
    ]),
    description: schema.string.nullable({}, [rules.minLength(3)]),
  })

  public messages = this.ctx.i18n.validatorMessages('validator.project.create')
}
