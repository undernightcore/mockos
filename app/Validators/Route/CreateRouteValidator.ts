import { schema, rules } from '@ioc:Adonis/Core/Validator'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class CreateRouteValidator {
  private isFolder = Boolean(this.ctx.request.input('isFolder', false))

  constructor(private ctx: HttpContextContract) {}

  public schema = schema.create(
    this.isFolder
      ? {
          name: schema.string({}, [rules.minLength(3), rules.maxLength(200)]),
        }
      : {
          name: schema.string({}, [rules.minLength(3), rules.maxLength(200)]),
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
            rules.regex(new RegExp('^/([a-zA-Z0-9{}-]+)*(/[a-zA-Z0-9{}-]+)*$')),
            rules.maxLength(2000),
          ]),
          parentFolderId: schema.number.nullable([
            rules.exists({ table: 'routes', column: 'id', where: { is_folder: true } }),
          ]),
          enabled: schema.boolean(),
        }
  )

  public messages = this.ctx.i18n.validatorMessages(
    this.isFolder ? 'validator.route.create_folder' : 'validator.route.create'
  )
}
