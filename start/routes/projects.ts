import Route from '@ioc:Adonis/Core/Route'

Route.group(() => {
  Route.get('', 'ProjectsController.getList')
  Route.post('', 'ProjectsController.create')
  Route.delete(':id', 'ProjectsController.leave')
  Route.put(':id', 'ProjectsController.edit')
  Route.get(':id', 'ProjectsController.get')
  Route.get(':id/members', 'ProjectsController.getMemberList')
  Route.post(':id/fork', 'ProjectsController.fork')
  Route.post(':id/leave', 'ProjectsController.leave')
  Route.post(':projectId/invite/:email', 'InvitationsController.invite')
  Route.post(':id/routes', 'RoutesController.create')
  Route.get(':id/routes', 'RoutesController.getList')
  Route.post(':id/move', 'RoutesController.moveAndSort')
  Route.post(':id/tokens', 'TokensController.create')
  Route.get(':id/tokens', 'TokensController.getList')
  Route.post(':id/swagger', 'SwaggerController.parse')
}).prefix('projects')
