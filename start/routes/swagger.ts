import Route from '@ioc:Adonis/Core/Route'

Route.group(() => {
  Route.post('', 'SwaggerController.parse')
}).prefix('swagger')
