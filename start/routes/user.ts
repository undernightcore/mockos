import Route from '@ioc:Adonis/Core/Route'

Route.group(() => {
  Route.get('', 'UserController.get')
  Route.post('login', 'UserController.login')
  Route.post('register', 'UserController.register')
  Route.get(':id/verify', 'UserController.verify').as('verifyEmail')
  Route.put('', 'UserController.edit')
  Route.put('email', 'UserController.editEmail')
}).prefix('user')
