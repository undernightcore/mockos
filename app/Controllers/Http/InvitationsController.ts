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

  public async accept({ response, auth, params, bouncer, i18n }: HttpContextContract) {
    const user = await auth.authenticate()
    const invitation = await Member.findOrFail(params.id)
    await bouncer.with('InvitationPolicy').authorize('isInvited', invitation)
    await invitation.load('project')
    invitation.verified = true
    await invitation.save()
    return response.ok({
      message: i18n.formatMessage('responses.invitation.accept.welcome_user', {
        project: invitation.project.name,
        name: user.name,
      }),
    })
  }

  public async reject({ response, auth, params, bouncer, i18n }: HttpContextContract) {
    await auth.authenticate()
    const invitation = await Member.findOrFail(params.id)
    await bouncer.with('InvitationPolicy').authorize('isInvited', invitation)
    await invitation.load('project')
    const count =
      (await invitation.project.related('members').query().count('* as total'))[0].$extras.total - 1
    if (count) {
      await invitation.delete()
    } else {
      await invitation.project.delete()
    }
    return response.ok({
      message: i18n.formatMessage('responses.invitation.reject.invitation_rejected'),
    })
  }

  public async invite({ response, params, auth, bouncer, i18n }: HttpContextContract) {
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
    return response.ok({
      message: i18n.formatMessage('responses.invitation.invite.user_invited', {
        name: user.name,
      }),
    })
  }
}
