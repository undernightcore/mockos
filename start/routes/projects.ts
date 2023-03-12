import Route from '@ioc:Adonis/Core/Route'

Route.group(() => {
  Route.get('', 'ProjectsController.getList')
  Route.post('', 'ProjectsController.create')
  Route.delete(':id', 'ProjectsController.delete')
  Route.put(':id', 'ProjectsController.edit')
  Route.get(':id', 'ProjectsController.get')
  Route.get(':id/members', 'ProjectsController.getMemberList')
  Route.post(':projectId/invite/:userId', 'InvitationsController.invite')
  Route.post(':id/routes', 'RoutesController.create')
  Route.get(':id/routes', 'RoutesController.getList')
  Route.post(':id/sort', 'RoutesController.sort')
}).prefix('projects')
