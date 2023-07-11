import Route from '@ioc:Adonis/Core/Route'

Route.group(() => {
  Route.put(':id', 'HeadersController.edit')
}).prefix('headers')
