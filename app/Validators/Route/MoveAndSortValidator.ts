import { rules, schema } from '@ioc:Adonis/Core/Validator'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class MoveAndSortValidator {
  constructor(private ctx: HttpContextContract) {}

  public schema = schema.create({
    what: schema.number([
      rules.exists({
        table: 'routes',
        column: 'id',
        where: { project_id: this.ctx.request.params().id },
      }),
    ]),
    into: schema.number.nullable([
      rules.exists({
        table: 'routes',
        column: 'id',
        where: { is_folder: true, project_id: this.ctx.request.params().id },
      }),
    ]),
    before: schema.number.nullable([
      rules.exists({
        table: 'routes',
        column: 'id',
        where: {
          parent_folder_id: this.ctx.request.body().into,
          project_id: this.ctx.request.params().id,
        },
      }),
    ]),
  })

  public messages = this.ctx.i18n.validatorMessages('validator.route.moveandsort')
}
