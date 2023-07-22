import { rules, schema } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class DuplicateResponseValidator {
  constructor(private ctx: HttpContextContract) {}

  public schema = schema.create({
    name: schema.string({}, [
      rules.unique({
        table: 'responses',
        column: 'name',
        where: { route_id: this.ctx.params.routeId },
      }),
      rules.maxLength(200),
    ]),
  })

  public messages = this.ctx.i18n.validatorMessages('validator.response.duplicate')
}
