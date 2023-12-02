import { Server } from 'socket.io'
import { logger } from './Services/logger.service'
import { app } from './app.middleware'
import flash from 'connect-flash'

const PORT = process.env.PORT !== undefined ? process.env.PORT : 8080
app.use(flash())

export const server = app.listen(PORT, () => {
  logger.info(`Listening on ${PORT}`)
})
export const io = new Server(server, { cors: { origin: 'http://localhost:3000/', methods: ['PUT', 'POST', 'GET'] } })
io.on('connection', () => { console.log('connection') })
