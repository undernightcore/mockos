import Route from '@ioc:Adonis/Core/Route'

Route.group(() => {
  Route.any(':token', 'ApiController.mock')
  Route.any(':token/*', 'ApiController.mock')
}).prefix('mock')
