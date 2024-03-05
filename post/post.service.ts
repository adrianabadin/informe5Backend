/* eslint-disable @typescript-eslint/no-confusing-void-expression */
/* eslint-disable @typescript-eslint/promise-function-async */
/* eslint-disable @typescript-eslint/no-misused-promises */
import { DatabaseHandler } from '../Services/database.service'
import { type Prisma, Prisma } from '@prisma/client'
import { logger } from '../Services/logger.service'
import { type MyCursor, type GenericResponseObject, ResponseObject } from '../Entities'
import { type PostManagerType, type CreatePostType, type ImagesSchema } from './post.schema'
import { FacebookService } from '../Services/facebook.service'
import { GoogleService } from '../Services/google.service'
import { ColumnPrismaError, NotFoundPrismaError, UniqueRestraintError, UnknownPrismaError } from '../Services/prisma.errors'
import { LogError } from 'concurrently'
import video from '@/icons/video.svg'
import { unknown } from 'zod'

export class PostService extends DatabaseHandler {
  constructor (
    protected facebookService = new FacebookService(),
    protected googleService = new GoogleService(),
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
      logger.debug({ function: 'pOSTsERVICE.photoGenerator', images })
      return images
    },
    public createPost = async (body: CreatePostType['body'], id: string, dataArray: Array<{ url: string, fbid: string }>) => {
      const { title, text, heading, classification, importance, audio, video } = body
      let numberImportance = 0
      let audioArray: Array<{ driveId: string, id: string }> = []
      let videoArray: Array<{ youtubeId: string, id: string }> = []
      if (audio !== undefined && Array.isArray(JSON.parse(audio ?? ''))) {
        audioArray = JSON.parse(audio)
      } else
      if (audio !== undefined) audioArray = [JSON.parse(audio)]
      if (video !== undefined && Array.isArray(JSON.parse(video))) { videoArray = JSON.parse(video) } else
      if (video !== undefined) videoArray = [JSON.parse(video)]
      if (importance !== undefined && typeof importance === 'string') numberImportance = parseInt(importance)
      console.log(videoArray, 'videoArray')
      return await this.prisma.posts.create({
        data: {
          isVisible: true,
          classification,
          heading,
          title,
          text,
          importance: numberImportance,
          images: { create: dataArray },
          author: { connect: { id } },
          audio: { connect: (audio !== undefined) ? audioArray.map(item => ({ id: item.id })) : [] },
          video: { connect: (video !== undefined) ? videoArray.map(item => ({ id: item.id })) : [] }

        },
        include: { author: { select: { lastName: true, name: true, username: true } } }
      }) // gCreate({ author: { connect: { id } }, isVisible: true, classification, heading, title, text, importance: numberImportance, images: { create: dataArray } })
    },
    public getPosts = async (paginationOptions?:
    { cursor?: Partial< MyCursor>, pagination: number },
    queryOptions?: Prisma.PostsFindManyArgs['where']
    ) /*: Promise<GenericResponseObject<Prisma.PostsCreateInput[]> | undefined> */ => {
      try {
        logger.debug({ queryOptions })
        const data = await this.prisma.posts.gGetAll({ images: true, author: true }, paginationOptions, queryOptions as any)
        // logger.debug({ function: 'PostService.getPosts', data })
        return data
      } catch (error) { logger.error({ function: 'PostService.getPosts', error }) }
    },
    public getPost = async (id: string) => {
      try {
        const response = await this.prisma.posts.findUnique(
          {
            where: { id },
            include: {
              author:
                      {
                        select:
                          {
                            avatar: true,
                            lastName: true,
                            name: true,
                            id: true
                          }
                      },
              images:
                    {
                      select:
                      {
                        fbid: true,
                        url: true,
                        updatedAt: true,
                        id: true
                      }
                    },
              audio: {
                select: {
                  id: true,
                  driveId: true
                }
              },
              video:
                    {
                      select:
                      {
                        id: true,
                        youtubeId: true,
                        url: true
                      }
                    }
            }
          })
        const latestNews = await this.prisma.posts.findMany({ where: {}, orderBy: { createdAt: 'desc' }, take: 4, include: { video: { select: { youtubeId: true, id: true } }, images: { select: { url: true, id: true } }, audio: { select: { driveId: true, id: true } } } })
        /**
 * debo revalidar las imagenes de la pagina solicitada y de las ultimas noticias
 */

        // const data = await this.prisma.posts.findUnique(
        //   {
        //     where: { id },
        //     include: {
        //       author:
        //             {
        //               select:
        //                 {
        //                   avatar: true,
        //                   lastName: true,
        //                   name: true,
        //                   id: true
        //                 }
        //             },
        //       images:
        //           {
        //             select:
        //             {
        //               fbid: true,
        //               url: true,
        //               updatedAt: true,
        //               id: true
        //             }
        //           },
        //       audio: {
        //         select: {
        //           id: true,
        //           driveId: true
        //         }
        //       },
        //       video:
        //           {
        //             select:
        //             {
        //               id: true,
        //               youtubeId: true,
        //               url: true
        //             }
        //           }
        //     }
        //   }) // gFindById(id, field as any)
        logger.debug({ function: 'PostService.getPost', data: response })
        return {
          ...response,
          latestNews: latestNews.map(({ audio, heading, id, images, title, video, createdAt, classification }) => {
            return { audio, heading, id, images, title, video, createdAt, classification }
          })
        }
      } catch (error) { logger.error({ function: 'PostService.getPost', error }) }
    },
    public updatePhoto = async (photo: Prisma.PhotosCreateInput) => {
      try {
        const data = await this.prisma.photos.update({ where: { id: photo.id }, data: { ...photo, updatedAt: undefined } })
        logger.debug({ function: 'PostService.updatePhoto', data })
        return data
      } catch (error) { logger.error({ function: 'PostService.updatePhoto', error }) }
    },
    public updatePost = async (postObject: Omit<Prisma.PostsUpdateInput, 'images' | 'audio' | 'importance'> & { audio?: string | undefined, importance: '1' | '2' | '3' | '4' | '5' }, idParam: string, photoObject: ImagesSchema[] | undefined): Promise<GenericResponseObject<Prisma.PostsUpdateInput>> => {
      let ids
      let ids2: string[] | undefined
      let photoObjectNoUndefinedFalse: ImagesSchema[]
      let photoObjectNoUndef: ImagesSchema[]
      const audioFromDB: Array<{ id: string, driveId: string }> =
      postObject.audio !== undefined &&
      JSON.parse(postObject.audio) !== null
        ? Array.isArray(postObject.audio)
          ? JSON.parse(postObject.audio)
          : [JSON.parse(postObject.audio)]
        : undefined
      const videoFromDb: Array<{ youtubeId: string, id: string }> | undefined = (postObject?.video !== undefined) ? Array.isArray(postObject.video) ? postObject.video as unknown as Array<{ youtubeId: string, id: string }> : [postObject.video as { youtubeId: string, id: string }] : undefined
      console.log(postObject.video, videoFromDb, 'Vodeo data')
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
          /**
 * creo que el error esta en que deleteMany esta mal implementado. De ultima sacamos el deleteMany
 *
 */
          const deleteAudioResponse = await this.prisma.audio.deleteMany({ where: { postsId: postObject.id as string } })
          const deleteVideoResponse = await this.prisma.video.deleteMany({ where: { postsId: postObject.id as string } })
          const audioMap = (audioFromDB !== undefined) ? { create: audioFromDB.map(item => ({ driveId: item.driveId })) } : undefined
          const videoMap = (videoFromDb !== undefined) ? { connect: videoFromDb.map(item => ({ youtubeId: item.youtubeId })) } : undefined
          const imageMap = photoObjectNoUndef.map(photo => {
            return { ...photo }
          })
          const data = await this.prisma.posts.update(
            {
              where: { id: idParam },
              data: {
                ...postObject,
                isVisible: true,
                updatedAt: undefined,
                author: { connect: { id: author } },
                importance: parseInt(postObject.importance as string),
                audio: audioMap,
                video: videoMap,
                images: {
                  deleteMany:
                    {
                    },
                  create: imageMap

                }
              },
              include: { audio: { select: { driveId: true, id: true } }, images: { select: { url: true, fbid: true, id: true } }, video: { select: { youtubeId: true } } }
            })
          console.log(deleteAudioResponse, deleteVideoResponse, data)
          // const data = transaction

          logger.debug({ function: 'PostService.updatePost', data })
          return new ResponseObject(null, true, data)
        } catch (error) {
          logger.error({ function: 'PostService.updatePost', error })
          return new ResponseObject(error, false, null)
        }
      } else {
        try {
          const transactionResponse = await this.prisma.$transaction([
            this.prisma.audio.deleteMany({ where: { postsId: postObject.id as any } }),
            this.prisma.posts.update(
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

                  },
                  audio: (audioFromDB !== undefined) ? { create: audioFromDB.map(item => ({ driveId: item.driveId })) } : undefined,
                  video: (videoFromDb !== undefined) ? { connect: videoFromDb.map(item => ({ youtubeId: item.youtubeId })) } : undefined
                }
              })
          ])
          const [,data] = transactionResponse
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
        const response = await this.prisma.posts.update({ where: { id }, data: { fbid } })
        return response
      } catch (error) {
        logger.error({ function: 'PostService.addFBIDtoDB', error })
        return new ResponseObject(error, false, null)
      }
    },
    public deleteById = async (id: string): Promise<GenericResponseObject<Prisma.PostsUpdateInput>> => {
      try {
        const response = await this.prisma.posts.delete({ where: { id }, include: { audio: true, images: true } })// .gDelete(id)
        return new ResponseObject(null, true, response)
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
    },
    public addAudioToDB = async (driveId: string) => {
      try {
        const response = await this.prisma.audio.create({ data: { driveId } })
        return response
      } catch (error) {
        logger.error({ function: 'PostService.addAudioToDB', error })
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          switch (error.code) {
            case 'P2002':
              return new UniqueRestraintError(error, error.meta)
            case 'P2000':
              return new ColumnPrismaError(error, error.meta)
            case 'P2001':
              return new NotFoundPrismaError(error, error.meta)
            default:
              return new UnknownPrismaError(error, error.meta)
          }
        } else return error as Error
      }
    },
    public get30DaysPosts = async () => {
      try {
        const actualDate = new Date()
        actualDate.setDate(actualDate.getDate() - 30)
        const response = await this.prisma.posts.findMany({
          orderBy: { createdAt: 'desc' },
          where: { createdAt: { gt: actualDate } },
          include: {
            images: { select: { fbid: true, id: true, url: true, updatedAt: true } },
            video: { select: { id: true, url: true, youtubeId: true } },
            audio: { select: { id: true, driveId: true } },
            author: {
              select: {
                avatar: true,
                birthDate: true,
                lastName: true,
                name: true,
                isVerified: true
              }
            }

          }

        })
        const arrayId: any[] = []
        response.forEach(async (res) => {
          if (Array.isArray(res.images) && res.images.length > 0) {
            res.images.forEach(image => {
              if (new Date(image.updatedAt).getMilliseconds() < new Date().getMilliseconds() - 86400000 * 2) {
                arrayId.push({ id: image.fbid })
                console.log(image.fbid, image.updatedAt, 'entro')
              }
            })
            if (Array.isArray(arrayId) && arrayId.length > 0) {
              const images = await this.facebookService.getLinkFromId(arrayId)
              if (images.ok) {
                const dbTransaction = await this.prisma.$transaction(async (prisma) => {
                  for (const image of images.data) {
                    const modd = res.images.find(imageDB => {
                      console.log(image.fbid, imageDB.id)
                      return imageDB.fbid === image.fbid
                    })
                    if (modd !== undefined) {
                      modd.url = image.url
                    }

                    await prisma.photos.updateMany({ where: { fbid: image.fbid }, data: { url: image.url } })
                  }
                })
                console.log(dbTransaction, 'XXXXXXXXXXXXXXXXX')
              }
            }
          }
        })

        return response
      } catch (error) {
        logger.error({ function: 'PostService.get30DaysPosts', error })
        return new UnknownPrismaError(error)
      }
    }
    ,
    public getIds = async () => {
      try {
        const response = await this.prisma.posts.findMany({ select: { id: true } })
        return response
      } catch (error) {
        logger.error({ function: 'PostService.getIds', error })
      }
    }

  ) {
    super()
  }
}
