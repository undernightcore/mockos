import Route from '@ioc:Adonis/Core/Route'

Route.group(() => {
  Route.delete(':id', 'TokensController.delete')
}).prefix('tokens')
