import dotenv from 'dotenv'
import axios from 'axios'
import fs from 'fs'
import { ResponseObject } from '../Entities'
import { logger } from './logger.service'
dotenv.config()
export class FacebookService {
  constructor (
    public pageID = (process.env.FACEBOOK_PAGE != null) ? process.env.FACEBOOK_PAGE : 'me',
    public pageToken = (process.env.FB_PAGE_TOKEN !== null) ? process.env.FB_PAGE_TOKEN : '',
    public postPhoto = async (data: Express.Multer.File) => {
      let response
      if (this.pageToken === undefined || this.pageID === undefined) throw new Error('Must Provide Fb Credentials on enviromen Variables')

      try {
        response = await axios.post(`https://graph.facebook.com/${this.pageID}/photos?published=false&access_token=${this.pageToken}`, { source: fs.createReadStream(data.path) }, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }).then(response => {
          fs.unlinkSync(data.path)
          return response.data
        }).catch(error => {
          logger.error({ function: 'FacebookService.postPhoto.axiosPostRequest', error })
          if (fs.existsSync(data.path)) { fs.unlinkSync(data.path) }
          return new ResponseObject(error, false, null)
        })
      } catch (error) {
        logger.error({ function: 'FacebookService.postPhoto.axiosPostRequest', error })
        if (fs.existsSync(data.path)) { fs.unlinkSync(data.path) }
        return new ResponseObject(error, false, null)
      }

      return new ResponseObject(null, true, response)
    },
    public getLinkFromId = async (id: ResponseObject): Promise<ResponseObject> => {
      if (id.ok) {
        // https://graph.facebook.com/391159203017232?fields=link&access_token=EAAC6VEEU92EBAMdz1ZAcWHS199UPlJqArvcZCkVVOT5vF9sZBYzMixo4IoNTnguXZB2BCb3Ui3jhGUGIIKGEtIx8ZC3iiMlpuXUNZBWHaDEJjif0M04jLyPhBCISHvnOY9oYIuj1Qrz5ZBlH63pMN3G3kB0AzioZAZCKd3HyA1Swl0mEO9Dg8k3WgqG5WrqLZANM9uEkcrn7IFjAZDZD
        if (this.pageToken !== '') {
          try {
            const response = await axios.get(`https://graph.facebook.com/${id.data.id as string}?fields=link&access_token=${this.pageToken as string}`)
            if ('link' in response.data && response.data.link !== undefined) {
              return new ResponseObject(null, true, response.data.link)
            } else {
              logger.error({ function: 'FacebookService.getLinkFromId', error: 'Unable to find a link for the id provided' })
              return new ResponseObject('Unable to find a link for the id provided', false, null)
            }
          } catch (error) {
            logger.error({ function: 'FacebookService.getLinkFromId.axiosRequest', error })
            return new ResponseObject('Something went wrong on get Request to FacebookService. ', false, null)
          }
        } else {
          logger.error({ function: 'FacebookService.getLinkFromId', error: 'Must provide a page Token' })
          return new ResponseObject('Must provide a page Token', false, null)
        }
      } else {
        logger.error({ function: 'FacebookService.getLinkFromId', error: 'Parameter missmatch shpuld be a ResponseObject' })
        return new ResponseObject('Parameter missmatch shpuld be a ResponseObject', false, null)
      }
    },
    public facebookFeed = async (data: { title: string, heading: string, text: string, classification: string }, pictures: string[], id: string) => {
      let response
      try {
        const message: string = encodeURIComponent(data.title + '\n' + data.heading + '\n\n' + 'Para leer mas click en el link')
        const pictsArray = pictures.map(picture => {
          return picture.split('fbid=')[1].split('&')[0]
        })
        let link
        let data
        if (process.env.NEWSPAPER_URL !== undefined) {
          link = process.env.NEWSPAPER_URL + `/${id}`
          data = {
            message,
            link,
            attached_media: pictsArray.map(id => ({ media_fbid: id })),
            access_token: process.env.FB_PAGE_TOKEN

          }
        }
        try {
          console.log(data)
          response = await axios.post(` https://graph.facebook.com/${process.env.FACEBOOK_PAGE as string}/feed`, data)
          console.log(response)
        } catch (error) { console.log(error) }
      } catch (error) {
        logger.error({ function: 'FacebookService.facebookFeed', error })
        return new ResponseObject(error, false, null)
      }
    }

  ) {}
}
