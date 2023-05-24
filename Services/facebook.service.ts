import dotenv from 'dotenv'
import axios from 'axios'
dotenv.config()

export class FacebookService {
  constructor (
    public pageID = (process.env.FACEBOOK_PAGE != null) ? process.env.FACEBOOK_PAGE : 'me',
    public pageToken = (process.env.FB_PAGE_TOKEN !== null) ? process.env.FB_PAGE_TOKEN : '',
    public postPhoto = async (data: Express.Multer.File) => {
      axios.post(`https://graph.facebook.com/${this.pageID}/photos?access_token=${this.pageToken}`)
    }
  ) {}
}
