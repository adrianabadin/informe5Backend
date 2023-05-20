import { DatabaseHandler } from '../Services/database.service'
import { type Prisma } from '@prisma/client'

export class PostService extends DatabaseHandler {
  constructor (
    public createPost = async (data: Prisma.PostsCreateInput) => { return await this.prisma.posts.gCreate(data) }
  ) {
    super()
  }
}
