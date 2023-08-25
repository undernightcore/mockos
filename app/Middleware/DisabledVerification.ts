import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Env from '@ioc:Adonis/Core/Env'

export default class DisabledVerification {
  public async handle({ response }: HttpContextContract, next: () => Promise<void>) {
    if (Env.get('DISABLE_VERIFICATION')) {
      response.status(400).send({ errors: ['Email verification is disabled'] })
    } else {
      await next()
    }
  }
}
