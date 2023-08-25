import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Env from '@ioc:Adonis/Core/Env'

export default class DisabledVerification {
  public async handle({ response, i18n }: HttpContextContract, next: () => Promise<void>) {
    if (Env.get('DISABLE_VERIFICATION')) {
      response
        .status(400)
        .send({ errors: [i18n.formatMessage('middleware.disabled_verification.disabled')] })
    } else {
      await next()
    }
  }
}
