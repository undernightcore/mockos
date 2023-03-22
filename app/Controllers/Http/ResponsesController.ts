import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Route from 'App/Models/Route'
import Project from 'App/Models/Project'
import CreateResponseValidator from 'App/Validators/Response/CreateResponseValidator'
import Database from '@ioc:Adonis/Lucid/Database'

export default class ResponsesController {
  public async create({ request, response, auth, bouncer, params }: HttpContextContract) {
    await auth.authenticate()
    const data = await request.validate(CreateResponseValidator)
    const route = await Route.findOrFail(params.id)
    const project = await Project.findOrFail(route.projectId)
    await bouncer.with('ProjectPolicy').authorize('isMember', project)
    await Database.transaction(async (trx) => {
      await route.useTransaction(trx).related('responses').query().update('enabled', false)
      await route.related('responses').create({ ...data, enabled: true })
      await trx.commit()
    })
    return response.created({ message: 'Se ha creado la respuesta' })
  }
}
