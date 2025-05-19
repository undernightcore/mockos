import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { rules, schema } from '@ioc:Adonis/Core/Validator'

export default class EditRouteValidator {
  constructor(private ctx: HttpContextContract) {}

  public schema = schema.create({
    name: schema.string({}, [rules.minLength(3), rules.maxLength(200)]),
    method: schema.enum(
      ['get', 'post', 'put', 'delete', 'patch'],
      [
        rules.unique({
          table: 'routes',
          column: 'method',
          where: {
            project_id: this.ctx.params.projectId ?? 0,
            endpoint: this.ctx.request.body().endpoint ?? '',
          },
          whereNot: {
            id: this.ctx.params.id,
          },
        }),
      ]
    ),
    endpoint: schema.string({}, [
      rules.regex(new RegExp('^/([a-zA-Z0-9{}_-]+)*(/[a-zA-Z0-9{}_-]+)*$')),
      rules.maxLength(2000),
    ]),
    enabled: schema.boolean(),
  })

  public messages = this.ctx.i18n.validatorMessages('validator.route.edit')
}
