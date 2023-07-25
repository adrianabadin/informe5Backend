import { DatabaseHandler } from '../Services/database.service'
import { type Prisma } from '@prisma/client'
import { logger } from '../Services/logger.service'
import { type MyCursor, type GenericResponseObject, ResponseObject } from '../Entities'
import { type UpdatePostType, type CreatePostType } from './post.schema'
import { createData } from '../../Informe5Front/src/components/posts/helpers/post.functions'

export class PostService extends DatabaseHandler {
  constructor (

    public createPost = async (body: CreatePostType, id: string, dataArray: Array<{ url: string, fbid: string }>) => {
      let { title, text, heading, classification, importance } = body
      if (importance !== undefined && typeof importance === 'string') importance = parseInt(importance)
      return await this.prisma.posts.gCreate({ author: { connect: { id } }, classification, heading, title, text, importance, images: { create: dataArray } })
    },
    public getPosts = async (paginationOptions?: { cursor?: Partial< MyCursor>, pagination: number }, queryOptions?: Prisma.PostsFindManyArgs['where']): Promise<GenericResponseObject<Prisma.PostsCreateInput[]> | undefined> => {
      try {
        logger.debug({ queryOptions })
        const data = await this.prisma.posts.gGetAll({ images: true }, paginationOptions, queryOptions)
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
      } catch (error) { logger.error({ function: 'PostService.updatePhoto', error }) }
    },
    public updatePost = async (postObject: Prisma.PostsUpdateInput, idParam: string, photoObject: Array<{ id: string, url: string, fbid: string }>) => {
      try {
        const data = await this.prisma.posts.update(
          {
            where: { id: idParam },
            data: {
              ...postObject,
              updatedAt: undefined,
              images: {
                deleteMany: {
                  NOT: {
                    id: { in: photoObject.map((photo) => photo.id) }
                  }
                },
                upsert: photoObject.map(photo =>
                  (
                    {
                      where: { id: photo.id },
                      update: { ...photo },
                      create: { ...photo }
                    }))
              }
            }
          })
        logger.debug({ function: 'PostService.updatePost', data })
        return new ResponseObject(null, true, data)
      } catch (error) {
        logger.error({ function: 'PostService.updatePost', error })
        return new ResponseObject(error, false, null)
      }
    }
  ) {
    super()
  }
}
