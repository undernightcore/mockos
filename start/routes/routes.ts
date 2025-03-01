import Route from '@ioc:Adonis/Core/Route'

Route.group(() => {
  Route.put(':id', 'RoutesController.edit')
  Route.get(':id', 'RoutesController.get')
  Route.delete(':id', 'RoutesController.delete')
  Route.post(':id/responses', 'ResponsesController.create')
  Route.get(':id/responses', 'ResponsesController.getList')
  Route.get(':id/processors', 'ResponsesController.getProcessorList')
}).prefix('routes')
