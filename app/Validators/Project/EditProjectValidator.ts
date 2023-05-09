import { schema, rules } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class EditProjectValidator {
  constructor(private ctx: HttpContextContract) {}

  public schema = schema.create({
    name: schema.string({}, [
      rules.minLength(3),
      rules.maxLength(200),
      rules.unique({ table: 'projects', column: 'name', whereNot: { id: this.ctx.params.id } }),
    ]),
    description: schema.string.nullable({}, [rules.minLength(3), rules.maxLength(2000)]),
  })
  public messages = this.ctx.i18n.validatorMessages('validator.project.edit')
}
