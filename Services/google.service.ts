import googleapis from 'googleapis'
import { prismaClient } from './database.service'
import { logger } from './logger.service'

export const oauthClient = new googleapis.google.auth.OAuth2(
  process.env.CLIENTID_BUCKET,
  process.env.CLIENTSECRET_BUCKET,
  process.env.CALLBACK_BUCKET)
const scopes = ['https://www.googleapis.com/auth/drive', 'https://www.googleapis.com/auth/youtube']
export const url = oauthClient.generateAuthUrl({ access_type: 'offline', scope: scopes })

export class GoogleService {
  static rt: string | null | undefined
  constructor (
    protected oAuthClient = oauthClient,
    protected prisma = prismaClient.prisma

  ) {
    if (GoogleService.rt === undefined) {
      this.prisma.dataConfig.findUniqueOrThrow({ where: { id: 1 }, select: { refreshToken: true } }).then(data => {
        GoogleService.rt = data?.refreshToken
        oAuthClient.setCredentials({ refresh_token: GoogleService.rt })
      }).catch(error => { logger.error({ function: 'GoogleService', message: 'RefreshToken is not present', error }) })
    }
  }
}
