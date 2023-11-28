import { logger } from './Services/logger.service'
import { app } from './app.middleware'
import { Server } from 'socket.io'
import { createServer } from 'http'
import flash from 'connect-flash'
const httpServer = createServer(app)
export const io = new Server(httpServer)
const PORT = process.env.PORT !== undefined ? process.env.PORT : 8080
// app.use(flash())

export const server = app.listen(PORT, () => {
  logger.info(`Listening on ${PORT}`)
})
io.on('connection', () => { console.log('Sockets Conected') })
