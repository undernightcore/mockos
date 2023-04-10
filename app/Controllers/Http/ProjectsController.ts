import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Project from 'App/Models/Project'
import EditProjectValidator from 'App/Validators/Project/EditProjectValidator'
import CreateProjectValidator from 'App/Validators/Project/CreateProjectValidator'
import Member from 'App/Models/Member'
import Database from '@ioc:Adonis/Lucid/Database'

export default class ProjectsController {
  public async create({ request, response, auth }: HttpContextContract) {
    const user = await auth.authenticate()
    const data = await request.validate(CreateProjectValidator)
    const project = await Project.create(data)
    await project.related('members').attach({ [user.id]: { verified: true } })
    return response.created(project)
  }

  public async delete({ response, params, bouncer, auth }: HttpContextContract) {
    await auth.authenticate()
    const project = await Project.findOrFail(params.id)
    await bouncer.with('ProjectPolicy').authorize('isMember', project)
    await project.delete()
    return response.ok({ message: `Se ha eliminado el projecto ${project.name} correctamente` })
  }

  public async edit({ request, params, response, auth, bouncer }: HttpContextContract) {
    await auth.authenticate()
    const data = await request.validate(EditProjectValidator)
    const project = await Project.findOrFail(params.id)
    await bouncer.with('ProjectPolicy').authorize('isMember', project)
    const newProject = await project?.merge(data).save()
    return response.ok(newProject)
  }

  public async get({ params, response, auth, bouncer }: HttpContextContract) {
    await auth.authenticate()
    const project = await Project.findOrFail(params.id)
    await bouncer.with('ProjectPolicy').authorize('isMember', project)
    return response.ok(project)
  }

  public async getList({ response, request, auth }: HttpContextContract) {
    const user = await auth.authenticate()
    const page = await request.input('page')
    const perPage = await request.input('perPage')
    const projectList = await user
      .related('projects')
      .query()
      .preload('forkedProject')
      .wherePivot('verified', true)
      .orderBy('created_at')
      .paginate(page ?? 1, perPage ?? 10)
    return response.ok(projectList)
  }

  public async getMemberList({ response, request, params, auth, bouncer }: HttpContextContract) {
    await auth.authenticate()
    const page = await request.input('page')
    const perPage = await request.input('perPage')
    const project = await Project.findOrFail(params.id)
    await bouncer.with('ProjectPolicy').authorize('isMember', project)
    const memberList = await Member.query()
      .where('project_id', project.id)
      .preload('user')
      .paginate(page ?? 1, perPage ?? 10)
    return response.ok(memberList)
  }

  public async fork({ response, request, params, auth, bouncer }: HttpContextContract) {
    const user = await auth.authenticate()
    const data = await request.validate(CreateProjectValidator)
    const project = await Project.findOrFail(params.id)
    await bouncer.with('ProjectPolicy').authorize('isMember', project)
    await Database.transaction(async (trx) => {
      const newProject = await Project.create(
        { ...data, forkedProjectId: project.id },
        { client: trx }
      )
      const oldRoutes = await project
        .related('routes')
        .query()
        .useTransaction(trx)
        .preload('responses')
      await Promise.all(
        oldRoutes.map(async (oldRoute) => {
          const { name, endpoint, method, enabled, order, responses } = oldRoute
          const newRoute = await newProject
            .related('routes')
            .create({ name, endpoint, method, enabled, order }, { client: trx })
          const newResponses = responses.map(({ name, body, status, enabled }) => ({
            name,
            body,
            status,
            enabled,
          }))
          await newRoute.related('responses').createMany(newResponses, { client: trx })
        })
      )
      await newProject.related('members').attach({ [user.id]: { verified: true } }, trx)
      await trx.commit()
    })
    return response.created({ message: 'Project forked successfully' })
  }
}
