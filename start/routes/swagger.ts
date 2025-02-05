import Route from '@ioc:Adonis/Core/Route'

Route.group(() => {
  Route.post('', 'HeadersController.edit')
}).prefix('swagger')
