import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Project from 'App/Models/Project'
import { randomString } from 'App/Helpers/Shared/string.helper'
import Token from 'App/Models/Token'
import CreateTokenValidator from 'App/Validators/Token/CreateTokenValidator'

export default class TokensController {
  public async create({ request, response, params, bouncer, i18n, auth }: HttpContextContract) {
    await auth.authenticate()
    const data = await request.validate(CreateTokenValidator)
    const project = await Project.findOrFail(params.id)
    await bouncer.with('ProjectPolicy').authorize('isMember', project, i18n)
    let token = randomString(40)
    while (await Token.findBy('token', token)) {
      token = randomString(40)
    }
    const newToken = await project.related('tokens').create({ token, ...data })
    return response.created(newToken)
  }

  public async delete({ response, params, bouncer, i18n, auth }: HttpContextContract) {
    await auth.authenticate()
    const token = await Token.findOrFail(params.id)
    const project = await Project.findOrFail(token.projectId)
    await bouncer.with('ProjectPolicy').authorize('isMember', project, i18n)
    await token.delete()
    return response.ok({ message: i18n.formatMessage('responses.token.delete.token_deleted') })
  }

  public async getList({ response, request, params, bouncer, i18n, auth }: HttpContextContract) {
    await auth.authenticate()
    const project = await Project.findOrFail(params.id)
    const page = request.input('page', 1)
    const perPage = request.input('perPage', 10)
    await bouncer.with('ProjectPolicy').authorize('isMember', project, i18n)
    const tokenList = await project.related('tokens').query().paginate(page, perPage)
    return response.ok(tokenList)
  }
}
