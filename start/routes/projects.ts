import Route from '@ioc:Adonis/Core/Route'

Route.group(() => {
  Route.get('', 'ProjectsController.getList')
  Route.post('', 'ProjectsController.create')
  Route.delete(':id', 'ProjectsController.delete')
  Route.put(':id', 'ProjectsController.edit')
  Route.get(':id', 'ProjectsController.get')
  Route.get(':id/members', 'ProjectsController.getMemberList')
  Route.post(':id/fork', 'ProjectsController.fork')
  Route.post(':id/leave', 'ProjectsController.leave')
  Route.post(':projectId/invite/:email', 'InvitationsController.invite')
  Route.post(':id/routes', 'RoutesController.create')
  Route.get(':id/routes', 'RoutesController.getList')
  Route.post(':id/sort', 'RoutesController.sort')
  Route.post(':id/move', 'RoutesController.move')
  Route.post(':id/tokens', 'TokensController.create')
  Route.get(':id/tokens', 'TokensController.getList')
  Route.get(':id/contracts/:version', 'ContractsController.get')
  Route.post(':id/contracts/rollback', 'ContractsController.rollback')
  Route.get(':id/contracts', 'ContractsController.get')
  Route.put(':id/contracts', 'ContractsController.edit')
  Route.get(':id/contract-versions', 'ContractsController.history')
}).prefix('projects')
