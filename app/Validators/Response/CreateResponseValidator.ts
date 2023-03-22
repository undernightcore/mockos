import { schema, CustomMessages, rules } from '@ioc:Adonis/Core/Validator'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class CreateResponseValidator {
  constructor(protected ctx: HttpContextContract) {}
  public schema = schema.create({
    status: schema.number([rules.range(100, 599)]),
    body: schema.string(),
    name: schema.string({}, [
      rules.unique({ table: 'responses', column: 'name', where: { route_id: this.ctx.params.id } }),
    ]),
  })

  public messages: CustomMessages = {
    'status.required': 'Es necesario un código HTTP para tu respuesta',
    'status.range': 'El código HTTP debe ser valido',
    'body.required': 'Es necesaria un cuerpo para tu respuesta',
    'name.required': 'Es necesario un nombre para tu respuesta',
    'name.unique': 'Este nombre de respuesta ya existe',
  }
}
