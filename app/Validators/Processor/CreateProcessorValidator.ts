import { schema, CustomMessages } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class CreateProcessorValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    enabled: schema.boolean(),
    code: schema.string(),
  })

  public messages: CustomMessages = this.ctx.i18n.validatorMessages('validator.processor.create')
}
