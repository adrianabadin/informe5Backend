import { DatabaseHandler } from '../Services/database.service'
import { type Prisma } from '@prisma/client'
import { logger } from '../Services/logger.service'
import { type MyCursor, type GenericResponseObject, ResponseObject } from '../Entities'
import { type UpdatePostType, type CreatePostType } from './post.schema'
import { FacebookService } from '../Services/facebook.service'

export class PostService extends DatabaseHandler {
  constructor (
    protected facebookService = new FacebookService(),
    public photoGenerator = async (files?: Express.Multer.File[], images?: UpdatePostType['body']['images']) => {
      let photoArray: Array<{ id: string } | undefined> = []
      if (files !== undefined && Array.isArray(files)) {
        photoArray = await Promise.all(files.map(async (file) => {
          const data = await this.facebookService.postPhoto(file)
          if (data.ok && 'id' in data.data && data.data.id !== undefined) { return data.data as { id: string } } else return undefined
        }))
        if (images !== undefined) { photoArray = [...photoArray, ...images?.map(image => ({ id: image.fbid }))] }
        if (photoArray !== null && Array.isArray(photoArray)) {
          const response = await this.facebookService.getLinkFromId(photoArray)
          console.log(response, 'hecho')
          // aqui se asigna a imagesArray todas las imagenes que debera tener el post ya sean las que no se eliminaron y las que se agreguen si hubiere
          if (response.ok) {
            if (images !== null && Array.isArray(images)) images = [...images, ...response.data]
            else images = [...response.data]
          }
          // ACA HAY QUE CONTINUAR LA LOGICA DE ACTUALIZACION DE LA BASE DE DATOS. HAY QUE VER SI CONVIENE USAR LA FUNCION UPDATEPIOST QUE HICE O
          // EVALUAR BORRAR TODAS LAS IMAGENES QUE HAY VINCULADAS AL POST Y REESCRIBIR LA BASE DE DATOS CON IMAGENES NUEVAS.
        }
      }
      return images
    },

    public createPost = async (body: CreatePostType['body'], id: string, dataArray: Array<{ url: string, fbid: string }>) => {
      const { title, text, heading, classification, importance } = body
      let numberImportance = 0
      if (importance !== undefined && typeof importance === 'string') numberImportance = parseInt(importance)
      return await this.prisma.posts.gCreate({ author: { connect: { id } }, classification, heading, title, text, importance: numberImportance, images: { create: dataArray } })
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
    public updatePost = async (postObject: Omit<Prisma.PostsUpdateInput, 'images'>, idParam: string, photoObject: UpdatePostType['body']['images']): Promise<GenericResponseObject<Prisma.PostsUpdateInput>> => {
      let ids
      let ids2
      let photoObjectNoUndefinedFalse
      let photoObjectNoUndef
      if (photoObject !== undefined) {
        ids = photoObject.map((photo): string | undefined => {
          if (typeof photo === 'object' && photo !== null && 'id' in photo && photo.id !== undefined && typeof photo.id === 'string') { return photo?.id } else return undefined
        })
        ids2 = ids.filter(img => img !== undefined) as string[]
        photoObjectNoUndefinedFalse = photoObject.map((photo) => {
          if (photo !== undefined && photo !== null) {
            if (typeof photo === 'object' && 'id' in photo && 'fbid' in photo && 'url' in photo) { return { fbid: photo.fbid, url: photo.url, id: photo.id } }
          }
          return false
        })
        photoObjectNoUndef = photoObjectNoUndefinedFalse.filter(img => img !== false) as Array<{ id?: string, fbid: string, url: string }>

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
                      id: {
                        in: ids2
                      }
                    }
                  },

                  upsert: photoObjectNoUndef.map(photo => {
                    let id: string = 'zorongo'
                    if (photo.id !== undefined) id = photo.id
                    return {
                      where: { id },
                      update: { ...photo },
                      create: { ...photo }
                    }
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
          const data: T = await this.prisma.posts.update(
            {
              where: { id: idParam },
              data: {
                ...postObject,
                updatedAt: undefined,
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
    }
  ) {
    super()
  }
}
