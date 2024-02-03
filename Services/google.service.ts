import { google, type drive_v3 } from 'googleapis'
import { prismaClient } from './database.service'
import { logger } from './logger.service'
import fs from 'fs'
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

  async initiateAuth (): Promise<boolean> {
    try {
      if (GoogleService.rt !== undefined && GoogleService.rt !== null) {
        return await this.isRTValid(GoogleService.rt)
      } else {
        const result = await this.prisma.dataConfig.findUniqueOrThrow({ where: { id: 1 }, select: { refreshToken: true } })
        GoogleService.rt = result.refreshToken
        if (result.refreshToken !== null) return await this.isRTValid(result.refreshToken)
        else return false
      }
    } catch (error) {
      logger.error({ function: 'GoogleService', error })
      return false
    }
  }

  async folderExists (folder: string): Promise<string | null | undefined> {
    try {
      if (await this.initiateAuth()) {
        const drive: drive_v3.Drive = google.drive({ version: 'v3', auth: oauthClient })
        const { data, status } = await drive.files.list({
          q: `mimeType='application/vnd.google-apps.folder' and name='${folder}'`,
          fields: 'files(id, name)'
        })
        if (status > 400) throw new Error('Server error')
        if (data.files !== undefined && data.files?.length > 0) {
          return data.files[0].id
        } else {
          const { data: dataCreated, status: statusCreated } = await drive.files.create({
            requestBody: {
              mimeType: 'application/vnd.google-apps.folder',
              name: folder
            }
          })
          if (statusCreated > 400) throw new Error('Server error: ')
          if (dataCreated !== undefined) { return dataCreated.id as string }
        }
      } else throw new Error('You need to refresh your google token')
    } catch (error) {
      logger.error({ function: 'GoogleService.folderExists', error })
    }
  }

  async fileUpload (folder: string, file: string): Promise<string | undefined> {
    if (GoogleService.rt === undefined) await this.initiateAuth()
    console.log(GoogleService.rt, folder, file)
    if (GoogleService.rt !== undefined) {
      try {
        const drive: drive_v3.Drive = google.drive({ version: 'v3', auth: oauthClient })
        const id: string | null | undefined = await this.folderExists(folder)
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
            if (permissionsResponse !== undefined) { await fs.promises.unlink(file) }
          } else throw new Error('Response is undefined or null')
          return response.data.id !== null ? response.data.id : undefined
        }
      } catch (error) { logger.error({ function: 'GoogleService.fileUpload', error }) }
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
