import Route from '@ioc:Adonis/Core/Route'

Route.group(() => {
  Route.get('', 'InvitationsController.getList')
  Route.post(':id/accept', 'InvitationsController.accept')
  Route.post(':id/reject', 'InvitationsController.reject')
}).prefix('invitations')
