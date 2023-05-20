import { type Request, type Response } from 'express'
import { PostService } from './post.service'
import { type Prisma } from '@prisma/client'
export class PostController {
  constructor (
    protected service = new PostService(),
    public createPost = (req: Request, res: Response) => {
      console.log('hi')
      const body: Prisma.PostsCreateInput = req.body
      const files = req.files
      console.log(body, files)
      res.send({ body, files })
    }
  ) {

  }
}
