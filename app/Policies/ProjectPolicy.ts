import Bouncer, { BasePolicy } from '@ioc:Adonis/Addons/Bouncer'
import User from 'App/Models/User'
import Project from 'App/Models/Project'

export default class ProjectPolicy extends BasePolicy {
  public async isMember(user: User, project: Project) {
    return Boolean(
      await project
        .related('members')
        .query()
        .where('user_id', user.id)
        .andWherePivot('verified', true)
        .first()
    )
  }

  public async isAlreadyMember(user: User, project: Project) {
    const member = await project.related('members').query().where('user_id', user.id).first()
    return member
      ? Bouncer.deny(
          member.verified
            ? 'Ya existe este miembro'
            : 'Este miembro está pendiente de aceptar la invitación',
          400
        )
      : true
  }
}
