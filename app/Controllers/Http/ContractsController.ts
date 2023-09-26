import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Project from 'App/Models/Project'
import UpdateSwaggerValidator from 'App/Validators/Swagger/UpdateSwaggerValidator'
import { parseSwagger, stringifySwagger } from 'App/Helpers/Shared/swagger.helper'
import {
  beautifyVersion,
  isVersionGreater,
  isVersionValid,
} from 'App/Helpers/Shared/version.helper'
import Ws from 'App/Services/Ws'

export default class ContractsController {
  public async edit({ request, response, auth, params, bouncer, i18n }: HttpContextContract) {
    const user = await auth.authenticate()
    const project = await Project.findOrFail(params.id)
    await bouncer.with('ProjectPolicy').authorize('isMember', project, i18n)

    const data = await request.validate(UpdateSwaggerValidator)

    const lastContract = await project
      .related('contracts')
      .query()
      .orderBy('version', 'desc')
      .first()

    const swagger = await parseSwagger(data.swagger).catch(() => {
      throw { status: 400, message: i18n.formatMessage('responses.swagger.edit.invalid_swagger') }
    })
    const currentVersion = lastContract?.version ?? null
    const newVersion = swagger.data.info.version

    if (data.originalVersion !== currentVersion) {
      throw { status: 409, message: i18n.formatMessage('responses.swagger.edit.outdated_version') }
    }

    if (!isVersionValid(newVersion)) {
      throw { status: 400, message: i18n.formatMessage('responses.swagger.edit.invalid_version') }
    }

    if (currentVersion !== null && !isVersionGreater(currentVersion, newVersion)) {
      throw { status: 400, message: i18n.formatMessage('responses.swagger.edit.greater_version') }
    }

    await project.related('contracts').create({
      version: beautifyVersion(newVersion),
      swagger: stringifySwagger(swagger.data, swagger.wasJSON),
      userId: user.id,
    })

    Ws.io.emit(`swagger:${project.id}`, `updated`)

    return response.ok({ message: i18n.formatMessage('responses.swagger.edit.swagger_saved') })
  }

  public async get({ response, request, params, auth, i18n, bouncer }: HttpContextContract) {
    await auth.authenticate()
    const project = await Project.findOrFail(params.id)
    await bouncer.with('ProjectPolicy').authorize('isMember', project, i18n)

    const version = request.input('version', null)

    const lastContract = version
      ? await project.related('contracts').query().whereColumn('version', String(version)).first()
      : await project.related('contracts').query().orderBy('version', 'desc').first()

    return response.ok({ swagger: lastContract?.swagger ?? null })
  }
}
