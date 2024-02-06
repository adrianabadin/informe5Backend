import { google, type drive_v3 } from 'googleapis'
import { prismaClient } from './database.service'
import { logger } from './logger.service'
import fs from 'fs'
import { FileCreateError, FolderCreateError, NeverAuthError, PermissionsCreateError, TokenError, UnknownGoogleError } from '../Entities'
export const oauthClient = new google.auth.OAuth2(
  process.env.CLIENTID_BUCKET,
  process.env.CLIENTSECRET_BUCKET,
  process.env.CALLBACK_BUCKET)
const scopes = ['https://www.googleapis.com/auth/drive', 'https://www.googleapis.com/auth/youtube', 'https://mail.google.com/']
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
      return new UnknownGoogleError(error)
    }
  }

  async fileUpload (folder: string, file: string): Promise<string | NeverAuthError | TokenError | FolderCreateError | FileCreateError | PermissionsCreateError | UnknownGoogleError> {
    try {
      if (GoogleService.rt === undefined) {
        const initiateResponse = await this.initiateAuth()
        console.log(initiateResponse)
        if (initiateResponse instanceof TokenError || initiateResponse instanceof NeverAuthError) throw initiateResponse
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

  async fileRemove (driveId: string): Promise<boolean> {
    try {
      const drive: drive_v3.Drive = google.drive({ version: 'v3', auth: oauthClient })
      const response = await drive.files.delete({
        fileId: driveId
      })
      if (response === undefined) throw new Error('Error deleting drive: ' + driveId)
      return true
    } catch (error) {
      logger.error({ function: 'GoogleService.fileRemove', error })
      return false
    }
  }
}
export const driveMan = new GoogleService()
