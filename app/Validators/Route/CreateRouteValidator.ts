import { schema, rules } from '@ioc:Adonis/Core/Validator'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class CreateRouteValidator {
  constructor(private ctx: HttpContextContract) {}

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

  public messages = this.ctx.i18n.validatorMessages('validator.route.create')
}
