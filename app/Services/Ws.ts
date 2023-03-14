import { Server } from 'socket.io'
import AdonisServer from '@ioc:Adonis/Core/Server'

class Ws {
  public io: Server
  public boot() {
    if (this.io) return
    this.io = new Server(AdonisServer.instance, {
      cors: {
        origin: '*',
      },
    })
  }
}

export default new Ws()
