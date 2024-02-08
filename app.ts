import { Server } from 'socket.io'
import { logger } from './Services/logger.service'
import { app } from './app.middleware'
import flash from 'connect-flash'
import { z } from 'zod'
const dotenvSchema = z.object({
  DATABASE_URL: z.string({ required_error: 'Must provide a URL to connect to the database' }),
  LOG_DIRECTORY: z.string({ required_error: 'Must provide a path to the logs directory' }),
  TKN_EXPIRATION: z.string({ required_error: 'Must define JWT duration' }),
  KEYS_PATH: z.string({ required_error: 'Must provide a path to Crpto asimetric keys' }),
  CLIENTID: z.string({ required_error: 'Must provide google client ID' }),
  CALLBACKURL: z.string({ required_error: 'Must provide a callback URL for google o auth' }),
  CLIENTSECRET: z.string({ required_error: 'Must provide client secret key for google' }),
  SIMETRICKEY: z.string({ required_error: 'Must provide a simetricKey for simetric encriptation' }),
  FACEBOOK_APP_ID: z.string({ required_error: 'Must provide facebook app ID' }),
  FACEBOOK_APP_SECRET: z.string({ required_error: 'Must provide facebook app secret' }),
  FACEBOOK_APP_CB: z.string({ required_error: 'Must provide a callback url for Facebook oauth' }),
  FACEBOOK_PAGE: z.string({ required_error: 'Must provide a facebook page id you admin to post the news  ' }),
  FB_PAGE_TOKEN: z.string({ required_error: 'Must provide a permanent token for the page' }),
  NEWSPAPER_URL: z.string({ required_error: 'Must provide the front end URL' }),
  CLIENTID_BUCKET: z.string({ required_error: 'Must provide google client ID for the bucket' }),
  CLIENTSECRET_BUCKET: z.string({ required_error: 'Must provide client secret key for google bucket' }),
  CALLBACK_BUCKET: z.string({ required_error: 'Must provide a callback URL for google o auth bucket' }),
  YOUTUBE_CHANNEL: z.string({ invalid_type_error: 'Must provide a string as a channel id' }).optional()

})
dotenvSchema.parse(process.env)
type enviromentVariables = z.infer<typeof dotenvSchema>
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS{
    interface ProcessEnv extends enviromentVariables {}
  }
}
export const userLogged: {
  isVerified: boolean
  lastName: string
  id: string
  fbid: string
  username: string
  name: string
  rol: string
  accessToken: string | null
} = { isVerified: false, lastName: '', id: '', username: '', name: '', rol: '', accessToken: '', fbid: '' }
const PORT = process.env.PORT !== undefined ? process.env.PORT : 8080
app.use(flash())

export const server = app.listen(PORT, () => {
  logger.info(`Listening on ${PORT}`)
})

export const io = new Server(server, { cors: { origin: 'http://localhost:3000/', methods: ['PUT', 'POST', 'GET'] } })
io.on('connection', () => { console.log('connection') })
