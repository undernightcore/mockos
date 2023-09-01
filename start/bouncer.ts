import Bouncer from '@ioc:Adonis/Addons/Bouncer'
export const { actions } = Bouncer

export const { policies } = Bouncer.registerPolicies({
  GlobalPolicy: () => import('App/Policies/GlobalPolicy'),
  ProjectPolicy: () => import('App/Policies/ProjectPolicy'),
  InvitationPolicy: () => import('App/Policies/InvitationPolicy'),
  RoutePolicy: () => import('App/Policies/RoutePolicy'),
})
