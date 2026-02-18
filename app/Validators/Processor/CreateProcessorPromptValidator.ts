import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { CustomMessages, schema } from '@ioc:Adonis/Core/Validator'

export default class CreateProcessorPromptValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    request: schema.string(),
  })

  public messages: CustomMessages = this.ctx.i18n.validatorMessages('validator.processor.prompt')
}
