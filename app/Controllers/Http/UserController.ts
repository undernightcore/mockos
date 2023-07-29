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
    const user = await User.create(data)
    const verificationUrl = Route.makeSignedUrl('verifyEmail', {
      email: user.email,
    })
    await Mail.send((message) => {
      message
        .from(Env.get('SMTP_EMAIL'))
        .to(user.email)
        .subject(i18n.formatMessage('responses.user.register.verify_subject'))
        .text(
          i18n.formatMessage('responses.user.register.verify_message', {
            url: `${Env.get('BACK_URL')}${verificationUrl}}`,
          })
        )
    })
    return response.created({
      message: i18n.formatMessage('responses.user.register.verify_email', { name: user.name }),
    })
  }

  public async verify({ request, response, params }: HttpContextContract) {
    if (!request.hasValidSignature()) return response.redirect(Env.get('VERIFY_FAILURE_URL'))
    const user = await User.findBy('email', params.email)
    if (!user) return response.redirect(`${Env.get('FRONT_URL')}/verify/failure`)
    if (user.verified) {
      user.email = params.email
    } else {
      user.verified = true
    }
    await user.save()
    return response.redirect(`${Env.get('FRONT_URL')}/verify/success`)
  }

  public async login({ request, response, auth, i18n }: HttpContextContract) {
    const data = await request.validate(LoginValidator)
    try {
      const token = await auth.attempt(data.email, data.password)
      const user = await User.findBy('email', data.email)
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

  public async editEmail({ request, response, auth, i18n }: HttpContextContract) {
    await auth.authenticate()
    const { email } = await request.validate(EditUserEmailValidator)
    const verificationUrl = Route.makeSignedUrl('verifyEmail', { email })
    await Mail.send((message) => {
      message
        .from(Env.get('SMTP_EMAIL'))
        .to(email)
        .subject(i18n.formatMessage('responses.user.email.verify_subject'))
        .text(
          i18n.formatMessage('responses.user.email.verify_message', {
            url: `${Env.get('BACK_URL')}${verificationUrl}}`,
          })
        )
    })
    return response.ok({ message: 'responses.user.email.verify_email' })
  }
}
