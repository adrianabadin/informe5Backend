/* eslint-disable @typescript-eslint/prefer-optional-chain */
/* eslint-disable @typescript-eslint/no-misused-promises */
import { type Request, type Response } from 'express'
import { PostService } from './post.service'
import { PrismaClient, type Prisma } from '@prisma/client'
import { GoogleService } from '../google/google.service'
import { FacebookService } from '../Services/facebook.service'
import { logger } from '../Services/logger.service'
import { type GenericResponseObject, ResponseObject } from '../Entities/response'
import { type CreatePostType, type GetPostsType, type GetPostById, type UpdatePostType } from './post.schema'
export class PostController {
  constructor (
    protected service = new PostService(),
    protected prisma = new PrismaClient(),
    protected googleService = new GoogleService(),
    protected facebookService = new FacebookService(),
    public updatePost = async (req: Request<GetPostById['params'], any, UpdatePostType['body'] >, res: Response) => {
      const files = req.files
      const { images } = req.body
      const { id } = req.params
      const imagesArray = await this.service.photoGenerator(files as Express.Multer.File[], images)
      let body = req.body
      if (body !== null && typeof body === 'object' && 'images' in body) { body = { ...body, images: undefined } }
      const updateDbResponse = await this.service.updatePost(body as Prisma.PostsUpdateInput, id, imagesArray)
      res.send(updateDbResponse.data)
      // aca va el codigo que updatea el post pero para eso necesito un id valido.
    // el nodo es pageid_postiD?message=texto&attached_media=array de media_fbid
    // eso hay que construirlo en el facebookservice
    },
    public createPost = async (req: Request<any, any, CreatePostType['body']>, res: Response) => {
      const body = req.body
      const files = req.files
      console.log('create')
      try {
        const imagesArray = await this.service.photoGenerator(files as Express.Multer.File[])
        console.log({ imagesArray }, 'photos')
        if (req.user !== undefined && 'id' in req.user && typeof req.user.id === 'string' && imagesArray !== undefined) {
          const responseDB = await this.service.createPost(body, req.user.id, imagesArray as Array<{ fbid: string, url: string }>)
          console.log({ responseDB }, 'DB')
          if (responseDB.ok && typeof responseDB.data === 'object' && responseDB.data !== null && 'id' in responseDB.data && typeof responseDB.data.id === 'string') {
            const facebookFeedResponse = await this.facebookService.facebookFeed(body, imagesArray, responseDB.data.id)
            console.log(facebookFeedResponse?.data, { facebookFeedResponse }, 'FB')
            if (facebookFeedResponse !== undefined && facebookFeedResponse.ok && 'id' in facebookFeedResponse.data.data) {
              const fbidUpdate = await this.service.addFBIDtoDatabase(facebookFeedResponse?.data.data.id as string, responseDB.data.id)
              res.status(200).send(fbidUpdate)
            } else throw new Error('Error Updating Facebook Page Post')
          } else throw new Error('Error updating Database')
        }
      } catch (error) {
        logger.error({ function: 'PostController.createPost', error })
        res.status(404).send(error)
      }
    },
    public getAllPosts = (req: Request<any, any, any, GetPostsType['query']>, res: Response) => {
      const { cursor, title, search, minDate, maxDate, category } = req.query
      const query: Prisma.PostsFindManyArgs['where'] & { AND: Array<Prisma.PostsFindManyArgs['where']> } = { AND: [] }

      if (title !== undefined) {
        query.AND.push({
          title: { contains: title }
        }
        )
      }
      if (category !== undefined) {
        query.AND.push({ classification: { contains: category as string } })
      }
      if (search !== undefined) {
        query.AND.push({
          OR:
         [{
           title: search
         },
         {
           text: search
         },
         { heading: search },
         { subTitle: search }
         ]

        }
        )
      }
      if (minDate !== undefined || maxDate !== undefined) {
        query.AND.push({
          AND: []
        }
        )
      }
      if (minDate !== undefined && query !== undefined && 'AND' in query) {
        const data = query.AND[query.AND.length - 1]
        if (data !== undefined && 'AND' in data && Array.isArray(data.AND)) { data.AND.push({ createdAt: { gte: new Date(minDate) } }) }
      }
      if (maxDate !== undefined) {
        const data = query.AND[query.AND.length - 1]
        if (data !== undefined && 'AND' in data && data?.AND !== undefined && Array.isArray(data.AND)) {
          data.AND.push({ createdAt: { lte: new Date(maxDate) } })
        }
      }
      console.log(query, query.AND[0])
      this.service.getPosts(
        {
          cursor: cursor === undefined ? undefined : { createdAt: new Date(cursor) },
          pagination: 50
        }, query
      ).then(async (response) => {
        if (response !== undefined && response.ok) {
          const data = response.data
          const checkedResponse = await Promise.all(data.map(async (post) => {
            return await this.checkPhotosAge(post?.images as Prisma.PhotosCreateInput[])
              .then(checkedPhotos => {
                if (checkedPhotos.data !== undefined) {
                  const finalData: Prisma.PhotosCreateInput[] = checkedPhotos.data// as Prisma.PhotosCreateNestedManyWithoutPostsInput
                  console.log(finalData, finalData.length)
                  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
                  post = { ...post, images: finalData.length === 1 && finalData[0] === undefined ? [] : finalData } as Prisma.PostsCreateInput
                  return post
                }
              }
              )

              .catch((error) => logger.error({ function: 'PostController.getAllPosts', error }))
          }))
          res.status(200).send(checkedResponse)
        }
      }).catch(error => {
        logger.error({ function: 'PostController.getAllPosts', error })
        res.status(404).send(error)
      })
    },
    public getPostById = (req: Request<GetPostById['params']>, res: Response) => {
      console.log('getbyid')
      const { id } = req.params
      this.service.getPost(id, { images: true }).then(async (response) => {
        if (response?.ok !== undefined && response.ok && 'data' in response) {
          this.checkPhotosAge(response?.data.images)
            .then(async (checkedPhotos: GenericResponseObject<Prisma.PhotosCreateInput[]>) => {
              console.log(checkedPhotos.data, 'LOKO')
              response.data = { ...response.data, images: checkedPhotos.data }
              res.status(200).send(response)
            })
            .catch((error: any) => logger.error({ function: 'PostController.getByid', error }))
        } else res.status(404).send(response)
      }).catch(error => {
        logger.error({ function: 'PostController.getPostById', error })
        res.status(404).send(error)
      })
    },
    protected checkPhotosAge = async (photosObject: Prisma.PhotosCreateInput[]): Promise<GenericResponseObject<Prisma.PhotosCreateInput[]>> => {
      if (Array.isArray(photosObject)) {
        try {
          const idArray = photosObject.map(photo => ({ id: photo.fbid }))
          const updatedLinksArray = await this.facebookService.getLinkFromId(idArray)
          const dbResponse: unknown[] = await this.prisma.$transaction(
            updatedLinksArray.data.map((photo): any =>
              this.prisma.photos.updateMany({
                where: { fbid: photo.fbid },
                data: { url: photo.url }
              })))
          console.log(dbResponse)
          return new ResponseObject(null, true, dbResponse)
        } catch (error) {
          logger.error({ function: 'PostController.checkedPhotos', error })
          return new ResponseObject(error, false, null)
        }
      }
      return new ResponseObject(new Error('Error updating photos'), false, null)
    }
    //   const data = await Promise.all(photosObject.map((photo): any => {
    //     if (photo?.id !== null) {
    //       if (photo.updatedAt instanceof Date) {
    //         if (photo.updatedAt !== null && photo.updatedAt instanceof Date && Date.now() - photo.updatedAt.getTime() > 1000 * 60 * 60 * 24 * 2) {
    //           return this.facebookService.getLinkFromId(new ResponseObject(null, true, { ...photo, id: photo.fbid }))
    //             .then(async (response) => {
    //               console.log(response)
    //               if (response.ok) {
    //                 return await this.service.updatePhoto({ ...photo, url: response.data.url })
    //                   .then(updatephotoResponse => updatephotoResponse)
    //                   .catch(error => {
    //                     logger.error({ function: 'PostController.checkPhotosAge.updatePhoto', error })
    //                   })
    //               }
    //             }
    //             )
    //             .catch(error => {
    //               logger.error({ function: 'Post.controller.checkphotoage.getLinkFromId', error })
    //             })
    //         } else return photo
    //       } else return undefined
    //     } else return undefined
    //   }))
    //   return new ResponseObject(null, true, data)
    // }
    // return new ResponseObject('Unespected Error', false, null)
    // }
  ) {

  }
}
