import { schema, CustomMessages, rules } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class EditResponseValidator {
  constructor(protected ctx: HttpContextContract) {}
  public schema = schema.create({
    enabled: schema.boolean(),
    status: schema.number([rules.range(100, 599)]),
    body: schema.string(),
    name: schema.string({}, [
      rules.unique({
        table: 'responses',
        column: 'name',
        where: { route_id: this.ctx.params.id },
        whereNot: { id: this.ctx.params.id },
      }),
    ]),
  })

  public messages: CustomMessages = {
    'enabled.required': 'Es necesario que indiques si la respuesta está activada',
    'status.required': 'Es necesario un código HTTP para tu respuesta',
    'status.range': 'El código HTTP debe ser valido',
    'body.required': 'Es necesaria un cuerpo para tu respuesta',
    'name.required': 'Es necesario un nombre para tu respuesta',
    'name.unique': 'Este nombre de respuesta ya existe',
  }
}
