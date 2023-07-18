import Route from '@ioc:Adonis/Core/Route'

Route.group(() => {
  Route.get(':id', 'ResponsesController.get')
  Route.put(':id', 'ResponsesController.edit')
  Route.delete(':id', 'ResponsesController.delete')
  Route.post(':id/enable', 'ResponsesController.enable')
  Route.get(':id/headers', 'HeadersController.getList')
  Route.post(':id/headers', 'HeadersController.create')
}).prefix('responses')
