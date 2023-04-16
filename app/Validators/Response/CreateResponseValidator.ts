import { schema, rules } from '@ioc:Adonis/Core/Validator'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class CreateResponseValidator {
  constructor(private ctx: HttpContextContract) {}
  public schema = schema.create({
    enabled: schema.boolean(),
    status: schema.number([rules.range(100, 599)]),
    body: schema.string(),
    name: schema.string({}, [
      rules.unique({ table: 'responses', column: 'name', where: { route_id: this.ctx.params.id } }),
    ]),
  })

  public messages = this.ctx.i18n.validatorMessages('validator.response.create')
}
