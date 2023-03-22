import { schema, CustomMessages, rules } from '@ioc:Adonis/Core/Validator'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class CreateRouteValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    name: schema.string({}, [rules.minLength(3)]),
    method: schema.enum(
      ['get', 'post', 'put', 'delete', 'patch'],
      [
        rules.unique({
          table: 'routes',
          column: 'method',
          where: {
            project_id: this.ctx.params.id ?? 0,
            endpoint: this.ctx.request.body().endpoint ?? '',
          },
        }),
      ]
    ),
    endpoint: schema.string({}, [
      rules.regex(new RegExp('^\\/[a-zA-Z0-9{}-]*(?:\\/[a-zA-Z0-9{}-]+$)*$')),
    ]),
    enabled: schema.boolean(),
  })

  public messages: CustomMessages = {
    'name.required': 'Se necesita una pequeña descripción para la ruta',
    'name.minLength': 'Es necesario que el nombre tenga como mínimo 3 carácteres',
    'method.required': 'Es necesario especificar un verbo HTTP',
    'method.enum': 'No es un verbo válido.',
    'method.unique': 'Ya existe una ruta con este método y endpoint en este proyecto',
    'endpoint.required': 'Es necesaria la URL del endpoint a crear',
    'endpoint.regex': 'El endpoint debe comenzar con / y no terminar en /',
    'enabled.required': 'Tienes que indicar el estado de la ruta',
  }
}
