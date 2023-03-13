import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Project from 'App/Models/Project'
import EditProjectValidator from 'App/Validators/Project/EditProjectValidator'
import CreateProjectValidator from 'App/Validators/Project/CreateProjectValidator'
import Member from 'App/Models/Member'

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
}
