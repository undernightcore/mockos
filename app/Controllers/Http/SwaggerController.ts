import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Project from 'App/Models/Project'
import UpdateSwaggerValidator from 'App/Validators/Swagger/UpdateSwaggerValidator'
import { parseSwagger } from 'App/Helpers/Shared/swagger.helper'
import { isVersionGreater, isVersionValid } from 'App/Helpers/Shared/version.helper'

export default class SwaggerController {
  public async edit({ request, response, auth, params, bouncer, i18n }: HttpContextContract) {
    await auth.authenticate()
    const project = await Project.findOrFail(params.id)
    await bouncer.with('ProjectPolicy').authorize('isMember', project, i18n)

    const data = await request.validate(UpdateSwaggerValidator)

    const swagger = await parseSwagger(data.swagger).catch(() => {
      throw { status: 400, message: '' }
    })
    const currentVersion = project.swagger
      ? await parseSwagger(project.swagger).then(({ data }) => data.info.version)
      : null
    const newVersion = swagger.data.info.version

    if (!isVersionValid(newVersion)) {
      return response.status(400).send({})
    }

    if (currentVersion !== null && !isVersionGreater(currentVersion, newVersion)) {
    }
  }
}
