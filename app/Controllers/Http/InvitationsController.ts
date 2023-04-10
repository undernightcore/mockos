import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Member from 'App/Models/Member'
import Project from 'App/Models/Project'
import User from 'App/Models/User'

export default class InvitationsController {
  public async getList({ request, response, auth }: HttpContextContract) {
    const user = await auth.authenticate()
    const page = await request.input('page')
    const perPage = await request.input('perPage')
    const invitations = await user
      .related('invitations')
      .query()
      .where('verified', false)
      .preload('project')
      .paginate(page ?? 1, perPage ?? 10)
    return response.ok(invitations)
  }

  public async accept({ response, auth, params, bouncer }: HttpContextContract) {
    const user = await auth.authenticate()
    const invitation = await Member.findOrFail(params.id)
    await bouncer.with('InvitationPolicy').authorize('isInvited', invitation)
    await invitation.load('project')
    invitation.verified = true
    await invitation.save()
    return response.ok({ message: `Bienvenido a ${invitation.project.name}, ${user.name}!` })
  }

  public async reject({ response, auth, params, bouncer }: HttpContextContract) {
    await auth.authenticate()
    const invitation = await Member.findOrFail(params.id)
    await bouncer.with('InvitationPolicy').authorize('isInvited', invitation)
    await invitation.delete()
    return response.ok({ message: `Has rechazado la invitación` })
  }

  public async invite({ response, params, auth, bouncer }: HttpContextContract) {
    await auth.authenticate()
    const project = await Project.findOrFail(params.projectId)
    const user = await User.findByOrFail('email', params.email)
    await bouncer.with('ProjectPolicy').authorize('isMember', project)
    await bouncer.forUser(user).with('ProjectPolicy').authorize('isAlreadyMember', project)
    await bouncer.forUser(user).with('GlobalPolicy').authorize('isVerified')
    await project.related('members').attach({
      [user.id]: {
        verified: false,
      },
    })
    return response.ok({ message: `Se ha invitado a ${user.name}` })
  }
}
