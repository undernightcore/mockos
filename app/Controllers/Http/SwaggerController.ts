import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Project from 'App/Models/Project'
import UpdateSwaggerValidator from 'App/Validators/Swagger/UpdateSwaggerValidator'
import { parseSwagger, stringifySwagger } from 'App/Helpers/Shared/swagger.helper'
import { isVersionGreater, isVersionValid } from 'App/Helpers/Shared/version.helper'
import Ws from 'App/Services/Ws'

export default class SwaggerController {
  public async edit({ request, response, auth, params, bouncer, i18n }: HttpContextContract) {
    await auth.authenticate()
    const project = await Project.findOrFail(params.id)
    await bouncer.with('ProjectPolicy').authorize('isMember', project, i18n)

    const data = await request.validate(UpdateSwaggerValidator)

    const swagger = await parseSwagger(data.swagger).catch(() => {
      throw { status: 400, message: i18n.formatMessage('responses.swagger.edit.invalid_swagger') }
    })
    const currentVersion = project.swagger
      ? await parseSwagger(project.swagger).then(({ data }) => data.info.version)
      : null
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

    project.swagger = stringifySwagger(swagger.data, swagger.wasJSON)
    await project.save()

    Ws.io.emit(`swagger:${project.id}`, `updated`)

    return response.ok({ message: i18n.formatMessage('responses.swagger.edit.swagger_saved') })
  }

  public async get({ response, params, auth, i18n, bouncer }: HttpContextContract) {
    await auth.authenticate()
    const project = await Project.findOrFail(params.id)
    await bouncer.with('ProjectPolicy').authorize('isMember', project, i18n)

    return response.ok({ swagger: project.swagger })
  }
}
