import Route from '@ioc:Adonis/Core/Route'

Route.group(() => {
  Route.put(':id', 'HeadersController.edit')
  Route.delete(':id', 'HeadersController.delete')
}).prefix('headers')
