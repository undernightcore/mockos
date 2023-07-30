import Route from '@ioc:Adonis/Core/Route'

Route.group(() => {
  Route.post('login', 'UserController.login')
  Route.post('register', 'UserController.register')
  Route.get(':id/verify', 'UserController.verify').as('verifyEmail')
  Route.put('edit', 'UserController.edit')
  Route.put('email', 'UserController.editEmail')
}).prefix('user')
