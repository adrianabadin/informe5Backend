import { type Request, type Response } from 'express'
import { PostService } from './post.service'
import { type Prisma } from '@prisma/client'
import { GoogleService } from '../google/google.service'
export class PostController {
  constructor (
    protected service = new PostService(),
    protected googleService = new GoogleService(),
    public createPost = async (req: Request, res: Response) => {
      console.log('hi')
      const body: Prisma.PostsCreateInput = req.body
      const files = req.files
      const dataArray: any = []
      if (files !== undefined && Array.isArray(files)) {
        files.forEach((file) => {
          this.googleService.uploadFile(file, 'temp').then(response => {
            dataArray.push(response)
            console.log(dataArray)
          }).catch(e => { console.log(e) })
        })
      } else {
        if (files !== undefined) {
          Object.keys(files).forEach(field => {
            files[field].forEach(file => {
              this.googleService.uploadFile(file, 'temp').then((response) => {
                console.log(response)
              }).catch((err) => { console.log(err) })
            })
          })
        }
      }
      res.send({ body, data: await dataArray })
    }
  ) {

  }
}
