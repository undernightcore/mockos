import Route from '@ioc:Adonis/Core/Route'

Route.group(() => {
  Route.post('login', 'UserController.login')
  Route.post('register', 'UserController.register')
  Route.get('verify/:email', 'UserController.verify').as('verifyEmail')
}).prefix('user')
