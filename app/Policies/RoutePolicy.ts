import Bouncer, { BasePolicy } from '@ioc:Adonis/Addons/Bouncer'
import User from 'App/Models/User'
import Route from 'App/Models/Route'
import { I18nContract } from '@ioc:Adonis/Addons/I18n'

export default class RoutePolicy extends BasePolicy {
  public async isNotFolder(_: User, route: Route, i18n: I18nContract) {
    return route.isFolder ? Bouncer.deny(i18n.formatMessage('bouncer.route.is_folder'), 400) : true
  }
}
