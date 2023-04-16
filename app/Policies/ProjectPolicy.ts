import Bouncer, { BasePolicy } from '@ioc:Adonis/Addons/Bouncer'
import User from 'App/Models/User'
import Project from 'App/Models/Project'
import { I18nContract } from '@ioc:Adonis/Addons/I18n'

export default class ProjectPolicy extends BasePolicy {
  public async isMember(user: User, project: Project, i18n: I18nContract) {
    return (
      Boolean(
        await project
          .related('members')
          .query()
          .where('user_id', user.id)
          .andWherePivot('verified', true)
          .first()
      ) || Bouncer.deny(i18n.formatMessage('bouncer.project.is_member'), 403)
    )
  }

  public async isAlreadyMember(user: User, project: Project, i18n: I18nContract) {
    const member = await project.related('members').query().where('user_id', user.id).first()
    return member
      ? Bouncer.deny(
          member.verified
            ? i18n.formatMessage('bouncer.project.is_already_member.is_verified')
            : i18n.formatMessage('bouncer.project.is_already_member.is_not_verified'),
          400
        )
      : true
  }
}
