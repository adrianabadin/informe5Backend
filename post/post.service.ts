import { DatabaseHandler } from '../Services/database.service'
import { type Prisma } from '@prisma/client'
import { logger } from '../Services/logger.service'
import { type MyCursor, type GenericResponseObject } from '../Entities'

export class PostService extends DatabaseHandler {
  constructor (

    public createPost = async (body: Prisma.PostsCreateInput, id: string, dataArray: Array<{ url: string, fbid: string }>) => {
      let { title, text, heading, classification, importance } = body
      if (importance !== undefined && typeof importance === 'string') importance = parseInt(importance)
      return await this.prisma.posts.gCreate({ author: { connect: { id } }, classification, heading, title, text, importance, images: { create: dataArray } })
    },
    public getPosts = async (paginationOptions?: { cursor?: Partial< MyCursor>, pagination: number }): Promise<GenericResponseObject<Prisma.PostsCreateInput[]> | undefined> => {
      try {
        const data = await this.prisma.posts.gGetAll({ images: true }, paginationOptions)
        logger.debug({ function: 'PostService.getPosts', data })
        return data
      } catch (error) { logger.error({ function: 'PostService.getPosts', error }) }
    },
    public getPost = async (id: string, field: Prisma.PostsFindFirstOrThrowArgs['include']) => {
      try {
        const data = await this.prisma.posts.gFindById(id, field)
        logger.debug({ function: 'PostService.getPost', data })
        return data
      } catch (error) { logger.error({ function: 'PostService.getPost', error }) }
    },
    public updatePhoto = async (photo: Prisma.PhotosCreateInput) => {
      try {
        const data = await this.prisma.photos.update({ where: { id: photo.id }, data: { ...photo, updatedAt: undefined } })
        logger.debug({ function: 'PostService.updatePhoto', data })
        return data
      } catch (error) {}
    }
  ) {
    super()
  }
}
