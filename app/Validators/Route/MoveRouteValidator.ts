import { rules, schema } from '@ioc:Adonis/Core/Validator'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class MoveRouteValidator {
  constructor(private ctx: HttpContextContract) {}

  public schema = schema.create({
    origin: schema.number([
      rules.exists({ table: 'routes', column: 'id', where: { is_folder: false } }),
    ]),
    destination: schema.number.nullable([
      rules.exists({ table: 'routes', column: 'id', where: { is_folder: true } }),
    ]),
  })

  public messages = this.ctx.i18n.validatorMessages('validator.route.move')
}
