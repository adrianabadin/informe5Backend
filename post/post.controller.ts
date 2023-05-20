import { type Request, type Response } from 'express'
import { PostService } from './post.service'
export class PostController {
  constructor (
    protected service = new PostService(),
    public createPost = (req: Request, res: Response) => {

    }
  ) {

  }
}
