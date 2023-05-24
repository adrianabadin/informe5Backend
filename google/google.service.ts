import { google } from 'googleapis'
import { Readable } from 'stream'
const auth = new google.auth.GoogleAuth({ keyFile: './google/informe5.json', scopes: ['https://www.googleapis.com/auth/drive'] })
export class GoogleService {
  constructor (
    protected driveClient = google.drive({ version: 'v3', auth }),
    public uploadFile = async (data: Partial< Express.Multer.File>, folder: 'temp' | 'ads' | 'images'): Promise<string> => {
      let finalFolder: string = ''
      switch (folder) {
        case 'ads':
          finalFolder = '1CYzgefR_FOcSxikDL1G5Tk_FvEkwM54D'
          break
        case 'images':
          finalFolder = '1avKzGbuo4O95BnrDTuv31ueFApQeXmJH'
          break
        case 'temp':
          finalFolder = '1IaPghauDQhyP6yNRDO9pxKFDkNS9rwDD'
          break
        default:
          finalFolder = '1IaPghauDQhyP6yNRDO9pxKFDkNS9rwDD'
          break
      }
      const uploadedFile = await this.driveClient.files.create({ requestBody: { mimeType: data.mimetype, name: data.originalname, parents: [finalFolder] }, media: { mimeType: data.mimetype, body: Readable.from(data.buffer as Buffer) } })
      console.log(uploadFile)
      await this.driveClient.permissions.create({ fileId: uploadedFile.data.id as string, requestBody: { role: 'reader', type: 'anyone' } })
      return `https://drive.google.com/file/d/${uploadedFile.data.id as string}/view?usp=sharing`
    }
  ) {}
}
