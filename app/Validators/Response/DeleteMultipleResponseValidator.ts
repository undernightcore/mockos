import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { rules, schema } from '@ioc:Adonis/Core/Validator'

export default class DeleteMultipleResponseValidator {
  constructor(private ctx: HttpContextContract) {}

  public schema = schema.create({
    ids: schema.array([rules.minLength(1)]).members(
      schema.number([
        rules.exists({
          column: 'id',
          table: 'responses',
          where: { route_id: this.ctx.params.id },
        }),
      ])
    ),
  })

  public messages = this.ctx.i18n.validatorMessages('validator.response.deleteMany')
}
