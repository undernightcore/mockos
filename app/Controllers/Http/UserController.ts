import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import User from 'App/Models/User'
import Mail from '@ioc:Adonis/Addons/Mail'
import Route from '@ioc:Adonis/Core/Route'
import RegisterValidator from 'App/Validators/User/RegisterValidator'
import LoginValidator from 'App/Validators/User/LoginValidator'
import Env from '@ioc:Adonis/Core/Env'
import EditUserValidator from 'App/Validators/User/EditUserValidator'
import EditUserEmailValidator from 'App/Validators/User/EditUserEmailValidator'

export default class UserController {
  public async register({ request, response, i18n }: HttpContextContract) {
    const data = await request.validate(RegisterValidator)
    const { id, email, name } = await User.create(data)
    const verificationUrl = this.#createVerificationUrl(id, 0)
    await this.#sendEmail(
      email,
      i18n.formatMessage('responses.user.register.verify_subject'),
      i18n.formatMessage('responses.user.register.verify_message', {
        url: `${Env.get('BACK_URL')}${verificationUrl}`,
      })
    )
    return response.created({
      message: i18n.formatMessage('responses.user.register.verify_email', { name }),
    })
  }

  public async verify({ request, response, params }: HttpContextContract) {
    if (!request.hasValidSignature()) return response.redirect(Env.get('VERIFY_FAILURE_URL'))
    const id = Number(params.id)
    const verifyLock = Number(request.qs().verifyLock)
    const email = request.qs().email
    const user = await User.find(id)
    if (!user || user.verifyLock !== verifyLock) {
      return response.redirect(`${Env.get('FRONT_URL')}/verify/failure`)
    }
    if (email && (await User.findBy('email', email))) {
      return response.redirect(`${Env.get('FRONT_URL')}/verify/failure`)
    }
    user.email = email ?? user.email
    user.verified = true
    user.verifyLock = user.verifyLock + 1
    await user.save()
    return response.redirect(`${Env.get('FRONT_URL')}/verify/success`)
  }

  public async login({ request, response, auth, i18n }: HttpContextContract) {
    const data = await request.validate(LoginValidator)
    try {
      const token = await auth.attempt(data.email, data.password, {
        expiresIn: '7 days',
      })
      const user = await User.findByOrFail('email', data.email)
      await this.#flushExpiredTokens(user)
      return user?.verified
        ? response.ok(token)
        : response.forbidden({ errors: [i18n.formatMessage('responses.user.login.verify_first')] })
    } catch {
      return response.unauthorized({
        errors: [i18n.formatMessage('responses.user.login.wrong_credentials')],
      })
    }
  }

  public async edit({ request, response, auth, i18n }: HttpContextContract) {
    const user = await auth.authenticate()
    const data = await request.validate(EditUserValidator)
    await user.merge(data).save()
    return response.ok({
      message: i18n.formatMessage('responses.user.edit.user_edited'),
    })
  }

  public async editEmail({ request, response, auth, i18n, bouncer }: HttpContextContract) {
    const { id, verifyLock } = await auth.authenticate()
    await bouncer.with('GlobalPolicy').authorize('isVerified', i18n)
    const { email } = await request.validate(EditUserEmailValidator)
    const verificationUrl = this.#createVerificationUrl(id, verifyLock, email)
    await this.#sendEmail(
      email,
      i18n.formatMessage('responses.user.email.verify_subject'),
      i18n.formatMessage('responses.user.email.verify_message', {
        url: `${Env.get('BACK_URL')}${verificationUrl}`,
      })
    )
    return response.ok({ message: i18n.formatMessage('responses.user.email.verify_email') })
  }

  // Helper functions

  async #sendEmail(email: string, subject: string, body: string) {
    await Mail.send((message) => {
      message.from(Env.get('SMTP_EMAIL')).to(email).subject(subject).text(body)
    })
  }

  async #flushExpiredTokens(user: User) {
    await user.related('tokens').query().delete().where('expires_at', '<', new Date())
  }

  #createVerificationUrl(id: number, verifyLock: number, email?: string) {
    return Route.makeSignedUrl('verifyEmail', { id }, { qs: { email, verifyLock } })
  }
}
