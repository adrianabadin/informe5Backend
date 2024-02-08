import { driveMan } from './Services/google.service'
// import fs from 'fs'

// driveMan.folderExists('audios').then(res => { console.log(res) }).catch(err => { console.log(err) })
// fs.promises.readFile('WhatsApp Image 2023-05-24 at 13.12.15.jpeg').then(res => {
//   driveMan.fileUpload('ads', fs.createReadStream('WhatsApp Image 2023-05-24 at 13.12.15.jpeg')).then(res => { console.log(res) }).catch(err => { console.log(err) })
// }).catch(err => { console.log(err) })
const path = './public/image-1705132838172-896058325-descarga.jfif'
const splitedPath = path.split('/')
console.log(splitedPath[splitedPath.length - 1])
// driveMan.fileUpload('ads', path).then(res => { console.log(res) }).catch(error => { console.log(error) })
driveMan.uploadVideo('yt1s.com - Rage Against The Machine  Wake Up Audio.mp4', 'Rage Against The Machine Wake Up', 'Matrix Song', 'UCgXlL-cvkeQw7h4BFrc_F3w').then((response: any) => { console.log(response) }).catch((e: any) => { console.error(e) })
