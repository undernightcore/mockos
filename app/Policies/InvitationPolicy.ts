import Bouncer, { BasePolicy } from '@ioc:Adonis/Addons/Bouncer'
import User from 'App/Models/User'
import Member from 'App/Models/Member'
import { I18nContract } from '@ioc:Adonis/Addons/I18n'

export default class InvitationPolicy extends BasePolicy {
  public async isInvited(user: User, invitation: Member, i18n: I18nContract) {
    const isUserInvited = invitation.userId === user.id
    return !isUserInvited
      ? Bouncer.deny(i18n.formatMessage('bouncer.invitation.is_invited'), 403)
      : true
  }
}
