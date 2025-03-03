import Route from '@ioc:Adonis/Core/Route'

Route.group(() => {
  Route.delete('selected', 'ResponsesController.deleteMultiple')
  Route.get(':id', 'ResponsesController.get')
  Route.put(':id', 'ResponsesController.edit')
  Route.delete(':id', 'ResponsesController.delete')
  Route.post(':id/enable', 'ResponsesController.enable')
  Route.post(':id/duplicate', 'ResponsesController.duplicate')
  Route.get(':id/headers', 'HeadersController.getList')
  Route.post(':id/headers', 'HeadersController.create')
  Route.get(':id/processor', 'ResponsesController.getProcessor')
  Route.post(':id/processor', 'ResponsesController.editProcessor')
}).prefix('responses')
