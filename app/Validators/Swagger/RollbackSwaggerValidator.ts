import { schema, CustomMessages, rules } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class RollbackSwaggerValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    version: schema.string({}, [
      rules.exists({
        table: 'contracts',
        column: 'version',
        where: { project_id: this.ctx.params.id },
      }),
    ]),
  })

  public messages: CustomMessages = this.ctx.i18n.validatorMessages('validator.swagger.rollback')
}
