import { google, type drive_v3 } from 'googleapis'
import { prismaClient } from './database.service'
import { logger } from './logger.service'
import fs from 'fs'
import { FileCreateError, FolderCreateError, GoogleError, NeverAuthError, PermissionsCreateError, QuotaExceededError, TokenError, UnknownGoogleError, VideoCreateError } from '../Entities'
export const oauthClient = new google.auth.OAuth2(
  process.env.CLIENTID_BUCKET,
  process.env.CLIENTSECRET_BUCKET,
  process.env.CALLBACK_BUCKET)
const scopes = ['https://www.googleapis.com/auth/drive', 'https://www.googleapis.com/auth/youtube', 'https://mail.google.com/', 'https://www.googleapis.com/auth/youtubepartner']
export const url = oauthClient.generateAuthUrl({ access_type: 'offline', scope: scopes })

export class GoogleService {
  static rt: string | null | undefined

  constructor (
    protected oAuthClient = oauthClient,
    protected prisma = prismaClient.prisma

  ) {
    this.fileUpload = this.fileUpload.bind(this)
    this.folderExists = this.folderExists.bind(this)
    this.initiateAuth = this.initiateAuth.bind(this)
    this.isRTValid = this.isRTValid.bind(this)
    this.fileRemove = this.fileRemove.bind(this)
    this.uploadVideo = this.uploadVideo.bind(this)
  }

  async isRTValid (tokenStr: string): Promise<boolean> {
    try {
      this.oAuthClient.setCredentials({ refresh_token: tokenStr })
      const { token } = await this.oAuthClient.getAccessToken()
      if (token === undefined) return false
      else return true
    } catch (error) {
      logger.error({ function: 'GoogleService.isRTValid', error })
      return false
    }
  }

  async initiateAuth (): Promise<true | TokenError | UnknownGoogleError | NeverAuthError> {
    try {
      if (GoogleService.rt !== undefined && GoogleService.rt !== null) {
        const response = await this.isRTValid(GoogleService.rt)
        if (response) return true
        else throw new TokenError()
      } else {
        const result = await this.prisma.dataConfig.findUniqueOrThrow({ where: { id: 1 }, select: { refreshToken: true } })
        GoogleService.rt = result.refreshToken
        if (result.refreshToken !== null) {
          const response = await this.isRTValid(result.refreshToken)
          if (response) return true
          else throw new TokenError()
        } else throw new NeverAuthError() // aca debe ir un error que signifique nunca fue autenticado
      }
    } catch (error) {
      logger.error({ function: 'GoogleService', error })
      if (error instanceof TokenError || error instanceof NeverAuthError) return error
      else return new UnknownGoogleError(error)
    }
  }

  async folderExists (folder: string): Promise<string | TokenError | NeverAuthError | FolderCreateError | UnknownGoogleError> {
    try {
      const initiateResponse = await this.initiateAuth()
      if (!(initiateResponse !== undefined && typeof initiateResponse === 'object' && 'code' in initiateResponse)) {
        const drive: drive_v3.Drive = google.drive({ version: 'v3', auth: oauthClient })
        const { data, status } = await drive.files.list({
          q: `mimeType='application/vnd.google-apps.folder' and name='${folder}'`,
          fields: 'files(id, name)'
        })
        if (status > 400) throw new FolderCreateError()
        if (data.files !== undefined && data.files?.length > 0 && data.files[0].id !== undefined && data.files[0].id !== null) {
          return data.files[0].id
        } else {
          const { data: dataCreated, status: statusCreated } = await drive.files.create({
            requestBody: {
              mimeType: 'application/vnd.google-apps.folder',
              name: folder
            }
          })
          if (statusCreated > 400) throw new Error('Server error: ')
          if (dataCreated?.id != null) { return dataCreated.id } else throw new FolderCreateError()
        }
      } else throw initiateResponse
    } catch (error) {
      logger.error({ function: 'GoogleService.folderExists', error })
      if (error instanceof TokenError || error instanceof NeverAuthError || error instanceof FolderCreateError) { return error } else { return new UnknownGoogleError(error) }
    }
  }

  async fileUpload (folder: string, file: string): Promise<string | NeverAuthError | TokenError | FolderCreateError | FileCreateError | PermissionsCreateError | UnknownGoogleError> {
    try {
      if (GoogleService.rt === undefined) {
        const initiateResponse = await this.initiateAuth()
        if (initiateResponse instanceof TokenError || initiateResponse instanceof NeverAuthError) {
          throw initiateResponse
        }
      }
      if (GoogleService.rt !== undefined) {
        const drive: drive_v3.Drive = google.drive({ version: 'v3', auth: oauthClient })
        const id: string | Error = await this.folderExists(folder)
        if (typeof id !== 'string' && id instanceof Error) throw id
        const splitedPath = file.split('/')

        if ((id) !== undefined && id !== null) {
          const response = await drive.files.create({
            requestBody: {
              parents: [id],

              name: splitedPath[splitedPath.length - 1]
            },
            media: {
              body: fs.createReadStream(file)
            }
          })
          let permissionsResponse
          if (response?.data !== null) {
            permissionsResponse = await drive.permissions.create({ fileId: response.data.id as string, requestBody: { role: 'writer', type: 'anyone' } })
            if (permissionsResponse !== undefined) { await fs.promises.unlink(file) } else {
              throw new PermissionsCreateError()
            }
          } else throw new FileCreateError()
          if (response.data.id !== undefined && response.data?.id !== null) {
            return response.data?.id
          } else throw new FileCreateError()
        } else throw new FolderCreateError()
      } throw new NeverAuthError()
    } catch (error) {
      logger.error({ function: 'GoogleService.fileUpload', error })
      if (error instanceof TokenError ||
        error instanceof NeverAuthError ||
        error instanceof FolderCreateError ||
        error instanceof FileCreateError ||
        error instanceof PermissionsCreateError) {
        return error
      } else return new UnknownGoogleError(error)
    }
  }

  async fileRemove (driveId: string): Promise<true | Error> {
    try {
      const initiateResponse = await this.initiateAuth()
      if (initiateResponse instanceof GoogleError) throw initiateResponse
      const drive: drive_v3.Drive = google.drive({ version: 'v3', auth: oauthClient })
      const response = await drive.files.delete({
        fileId: driveId
      })
      if (response === undefined) throw new Error('Error deleting drive: ' + driveId)
      return true
    } catch (error) {
      logger.error({ function: 'GoogleService.fileRemove', error })
      if (error instanceof TokenError || error instanceof NeverAuthError || error instanceof UnknownGoogleError) return error
      else return error as Error
    }
  }

  async uploadVideo (path: string, title: string, description: string, channelId?: string, tags?: string[]):
  Promise<string | TokenError | NeverAuthError | UnknownGoogleError | VideoCreateError | QuotaExceededError> {
    try {
      const initiateResponse = await this.initiateAuth()
      if (initiateResponse instanceof GoogleError) throw initiateResponse
      const youtube = google.youtube({ version: 'v3', auth: oauthClient })
      const video: any = await youtube.videos.insert({
        notifySubscribers: true,
        requestBody: {
          snippet: { title, description, tags, channelId, defaultAudioLanguage: 'es' },
          status: { privacyStatus: 'public' }
        },
        part: ['snippet', 'status'],
        media: {
          body: fs.createReadStream(path)

        }

      }
      )
      if (video.data === null) throw new VideoCreateError()
      if (video.data.id === undefined || video.data.id === null) throw new VideoCreateError()
      return video.data.id
    } catch (error: unknown) {
      if (typeof error === 'object' && error !== null && 'code' in error && error.code === 403) {
        if ('errors' in error) {
          if (Array.isArray(error.errors)) {
            const quotas = error.errors.map((errorItem: unknown): number => {
              if (typeof errorItem === 'object' && errorItem !== null && 'reason' in errorItem) {
                if (errorItem.reason === 'quotaExceeded') {
                  return 1
                }
              }
              return 0
            }).reduce((prev, cur) => prev + cur)
            if (quotas > 0) {
              logger.error({ function: 'GoogleService.uploadVideo', error: new QuotaExceededError(error) })
              return new QuotaExceededError(error)
            }
          }
        }
      }

      if (error instanceof TokenError || error instanceof NeverAuthError || error instanceof VideoCreateError || error instanceof QuotaExceededError) {
        logger.error({ function: 'GoogleService.uploadVideo', error })
        return error
      } else {
        logger.error({ function: 'GoogleService.uploadVideo', error: new UnknownGoogleError(error) })
        return new UnknownGoogleError(error)
      }
    }
  }

  async videoRm (id: string): Promise<TokenError | NeverAuthError | UnknownGoogleError | true> {
    try {
      const initiateResponse = await this.initiateAuth()
      if (initiateResponse instanceof GoogleError) throw initiateResponse
      const youtube = google.youtube({ version: 'v3', auth: oauthClient })
      await youtube.videos.delete({
        id

      })
      return true
    } catch (error) {
      if (error instanceof TokenError || error instanceof NeverAuthError || error instanceof UnknownGoogleError) {
        logger.error({ function: 'PostService.videoRm', error })
        return error
      } else return new UnknownGoogleError(error)
    }
  }
}
export const driveMan = new GoogleService()
