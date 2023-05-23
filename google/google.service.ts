import { google } from 'googleapis'
import fs from 'fs'
import { Blob } from 'buffer'
const auth = new google.auth.GoogleAuth({
  keyFile: 'informe5.json',
  scopes: 'https://www.googleapis.com/auth/drive'
})
export class GoogleService {
  constructor (
    protected driveClient = google.drive({ auth, version: 'v3' }),
    public uploadFile = async (data: any, folder: 'ads' | 'temp' | 'images') => {
      let finalFolder: string = ''
      if (folder === 'ads') finalFolder = '1CYzgefR_FOcSxikDL1G5Tk_FvEkwM54D'
      if (folder === 'images') finalFolder = '1avKzGbuo4O95BnrDTuv31ueFApQeXmJH'
      if (folder === 'temp') finalFolder = '1IaPghauDQhyP6yNRDO9pxKFDkNS9rwDD'
      console.log(data)
      // const file = await this.driveClient.files.create({
      //   requestBody: { name: data.name, mimeType: data.type, parents: [finalFolder] }, media: { body: data, mimeType: data.type }
      // })
    }
  ) {}
}
// const driveClient = google.drive({ auth, version: 'v3' })
// async function uploadSomething (): Promise<any> {
//   const file = await driveClient.files.create({ requestBody: { name: 'Adrian.txt', mimeType: 'text/plain', parents: ['1IaPghauDQhyP6yNRDO9pxKFDkNS9rwDD'] }, media: { mimeType: 'text/plain', body: 'Hola mundo!' } })
//   console.log(file)
// }
// uploadSomething().then(e => { console.log(e) }).catch(e => { console.error(e) })
// async function getFile (): Promise<any> {
//   const file = await driveClient.files.list()
//   console.log(file.data.files)
// }
// // getFile().then(e => { console.log(e) }).catch(e => { console.error(e) })
const data = fs.readFileSync('./google.service.ts')
const dataFile = new Blob([data])
console.log(dataFile)
const googleManager = new GoogleService()
googleManager.uploadFile(dataFile, 'temp').then(e => { console.log(e) }).catch(e => { console.error(e) })
