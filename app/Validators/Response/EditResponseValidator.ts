import { schema, rules } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class EditResponseValidator {
  #isFile = Boolean(this.ctx.request.input('isFile', false))

  constructor(private ctx: HttpContextContract) {}

  public schema = schema.create({
    enabled: schema.boolean(),
    status: schema.number([rules.range(100, 599)]),
    body: this.#isFile
      ? schema.file.optional({ size: '8MB' })
      : schema.string({}, [rules.maxLength(200000)]),
    name: schema.string({}, [
      rules.unique({
        table: 'responses',
        column: 'name',
        where: { route_id: this.ctx.params.id },
        whereNot: { id: this.ctx.params.id },
      }),
      rules.maxLength(200),
    ]),
  })

  public messages = this.ctx.i18n.validatorMessages('validator.response.edit')
}
