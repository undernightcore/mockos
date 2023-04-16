import { schema } from '@ioc:Adonis/Core/Validator'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class SortRouteValidator {
  constructor(private ctx: HttpContextContract) {}

  public schema = schema.create({
    origin: schema.number(),
    destination: schema.number(),
  })

  public messages = this.ctx.i18n.validatorMessages('validator.route.sort')
}
