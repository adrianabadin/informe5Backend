import { DatabaseHandler } from '../Services/database.service'
import { type Prisma } from '@prisma/client'
import { logger } from '../Services/logger.service'
import { type MyCursor, type GenericResponseObject, ResponseObject } from '../Entities'
import { type CreatePostType, type ImagesSchema } from './post.schema'
import { FacebookService } from '../Services/facebook.service'

export class PostService extends DatabaseHandler {
  constructor (
    protected facebookService = new FacebookService(),
    public photoGenerator = async (files: Express.Multer.File[], imagesParam?: ImagesSchema[]) => {
      let photoArray: Array<{ id: string } | undefined> = []
      let images: ImagesSchema[] | undefined = imagesParam
      if (files !== undefined && Array.isArray(files)) {
        photoArray = await Promise.all(files.map(async (file) => {
          const data = await this.facebookService.postPhoto(file)
          if (data.ok && 'id' in data.data && data.data.id !== undefined) { return data.data as { id: string } } else return undefined
        }))
        // else throw new Error(JSON.stringify({ error: 'No se enviaron imagenes', images }))
        if (photoArray !== null && Array.isArray(photoArray)) {
          const response = await this.facebookService.getLinkFromId(photoArray)
          // aqui se asigna a imagesArray todas las imagenes que debera tener el post ya sean las que no se eliminaron y las que se agreguen si hubiere
          if (response.ok) {
            if (images !== null && Array.isArray(images)) images = [...images, ...response.data]
            else images = [...response.data]
          }
        }
        if (images !== undefined && Array.isArray(images)) {
          photoArray = [...photoArray, ...images?.map(image => ({ id: image.fbid }))]
        }
      }
      console.log(images, 'imagnes')
      logger.debug({ function: 'pOSTsERVICE.photoGenerator', images })
      return images
    },

    public createPost = async (body: CreatePostType['body'], id: string, dataArray: Array<{ url: string, fbid: string }>) => {
      const { title, text, heading, classification, importance } = body
      let numberImportance = 0
      if (importance !== undefined && typeof importance === 'string') numberImportance = parseInt(importance)
      return await this.prisma.posts.gCreate({ author: { connect: { id } }, isVisible: true, classification, heading, title, text, importance: numberImportance, images: { create: dataArray } })
    },
    public getPosts = async (paginationOptions?:
    { cursor?: Partial< MyCursor>, pagination: number },
    queryOptions?: Prisma.PostsFindManyArgs['where']
    ): Promise<GenericResponseObject<Prisma.PostsCreateInput[]> | undefined> => {
      try {
        logger.debug({ queryOptions })
        const data = await this.prisma.posts.gGetAll({ images: true, author: true }, paginationOptions, queryOptions as any)
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
    public updatePost = async (postObject: Omit<Prisma.PostsUpdateInput, 'images'>, idParam: string, photoObject: ImagesSchema[] | undefined): Promise<GenericResponseObject<Prisma.PostsUpdateInput>> => {
      let ids
      let ids2: string[] | undefined
      let photoObjectNoUndefinedFalse: ImagesSchema[]
      let photoObjectNoUndef: ImagesSchema[]
      if ('jwt' in postObject) {
        postObject.jwt = undefined
      }
      logger.debug({ photoObject, function: 'updatePost.service' })
      if (photoObject !== undefined) {
        ids = photoObject.map((photo): string | undefined => {
          if (typeof photo === 'object' && photo !== null && 'id' in photo && photo.id !== undefined && typeof photo.id === 'string') { return photo?.id } else return undefined
        })
        ids2 = ids.filter((img: string | undefined) => img !== undefined) as string[] | undefined
        photoObjectNoUndefinedFalse = photoObject.map((photo) => {
          if (photo !== undefined && photo !== null) {
            return { fbid: photo.fbid, url: photo.url, id: photo.id }
            // if (typeof photo === 'object' && 'id' in photo && 'fbid' in photo && 'url' in photo) { return { fbid: photo.fbid, url: photo.url, id: photo.id } }
          }
          return { fbid: 'false', url: 'false', id: 'false' }
        })
        photoObjectNoUndef = photoObjectNoUndefinedFalse.filter(img => img.fbid !== 'false') as Array<{ id?: string, fbid: string, url: string }>
        try {
          const author: string = postObject.author as string
          /* aca debo hacer distintas ramas en el caso de que se tenga imagenes para borrar, tenga imagenes para agregar  */
          if (author === undefined) throw new Error('No author specified')
          const data = await this.prisma.posts.update(
            {
              where: { id: idParam },
              data: {
                ...postObject,
                isVisible: true,
                updatedAt: undefined,
                author: { connect: { id: author } },
                importance: parseInt(postObject.importance as string),

                images: {
                  deleteMany:
                  {
                  },
                  create: photoObjectNoUndef.map(photo => {
                    return { ...photo }
                  })

                }
              }
            })

          logger.debug({ function: 'PostService.updatePost', data })
          return new ResponseObject(null, true, data)
        } catch (error) {
          logger.error({ function: 'PostService.updatePost', error })
          return new ResponseObject(error, false, null)
        }
      } else {
        try {
          const data = await this.prisma.posts.update(
            {
              where: { id: idParam },
              data: {
                ...postObject,
                updatedAt: undefined,
                importance: parseInt(postObject.importance as string),
                author: { connect: { id: postObject.author as string } },
                images: {
                  deleteMany: {
                    NOT: {
                      id: {
                        in: ids2
                      }
                    }
                  }

                }
              }
            })
          logger.debug({ function: 'PostService.updatePost', data })
          return new ResponseObject(null, true, data)
          // va el codigo si no hay cambios en las photos
        } catch (error) {
          logger.error({ function: 'PostService.updatePost', error })
          return new ResponseObject(null, false, error)
        }
      }
    }, public addFBIDtoDatabase = async (fbid: string, id: string) => {
      try {
        console.log(fbid, id, 'addFBIDtoDatabase')
        const response = await this.prisma.posts.update({ where: { id }, data: { fbid } })
        return response
      } catch (error) {
        logger.error({ function: 'PostService.addFBIDtoDB', error })
        return new ResponseObject(error, false, null)
      }
    },
    public deleteById = async (id: string): Promise<GenericResponseObject<Prisma.PostsUpdateInput>> => {
      try {
        const response = await this.prisma.posts.gDelete(id)
        return response
      } catch (error) {
        logger.error({ function: 'PostService.deleteById', error })
        return new ResponseObject(error, false, null)
      }
    },
    public hidePost = async (id: string): Promise<GenericResponseObject<Prisma.PostsUpdateInput>> => {
      try {
        const response = await this.prisma.posts.update({ where: { id }, data: { isVisible: { set: false } } })
        return new ResponseObject(null, true, response)
      } catch (error) {
        logger.error({ function: 'PostService.hidePost', error })
        return new ResponseObject(error, false, null)
      }
    },
    public showPost = async (id: string): Promise<GenericResponseObject<Prisma.PostsUpdateInput>> => {
      try {
        const response = await this.prisma.posts.update({ where: { id }, data: { isVisible: { set: true } } })
        return new ResponseObject(null, true, response)
      } catch (error) {
        logger.error({ function: 'PostService.showPost', error })
        return new ResponseObject(error, false, null)
      }
    }
  ) {
    super()
  }
}
