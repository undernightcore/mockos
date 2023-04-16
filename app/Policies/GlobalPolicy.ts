import Bouncer, { BasePolicy } from '@ioc:Adonis/Addons/Bouncer'
import User from 'App/Models/User'
import { I18nContract } from '@ioc:Adonis/Addons/I18n'

export default class GlobalPolicy extends BasePolicy {
  public async isVerified(user: User, i18n: I18nContract) {
    return !user.verified ? Bouncer.deny(i18n.formatMessage('bouncer.global.is_verified')) : true
  }
}
