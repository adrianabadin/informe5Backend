/* eslint-disable @typescript-eslint/prefer-optional-chain */
/* eslint-disable @typescript-eslint/no-misused-promises */
import { response, type Request, type Response } from 'express'
import { PostService } from './post.service'
import { PrismaClient, type Prisma } from '@prisma/client'
// import { GoogleService } from '../google/google.service'
// import { GoogleService } from '../Services/google.service'
import { FacebookService } from '../Services/facebook.service'
import { logger } from '../Services/logger.service'
import { type ClassificationArray } from '../Entities'
import {
  type GenericResponseObject,
  ResponseObject,
  GoogleError,
  TokenError,
  NeverAuthError
} from '../Entities/response'
import {
  type CreatePostType,
  type GetPostsType,
  type GetPostById,
  type UpdatePostType,
  type ImagesSchema,
  type VideoUpload
} from './post.schema'
import { io } from '../app'
import { text } from 'node:stream/consumers'
import { GoogleService } from '../Services/google.service'
import { PrismaError } from '../Services/prisma.errors'
export class PostController {
  constructor (
    protected service = new PostService(),
    protected prisma = new PrismaClient(),
    protected googleService = new GoogleService(),
    protected facebookService = new FacebookService(),
    public updatePost = async (
      req: Request<GetPostById['params'], any, UpdatePostType['body']>,
      res: Response
    ) => {
      console.log('updating posts')
      logger.debug({ body: req.body, function: 'updatePost.controller' })
      const files = req.files
      let { dbImages, title, heading, classification } = req.body
      const { id } = req.params
      let imagesArray: ImagesSchema[] | undefined
      logger.debug({ dbImages, files, body: req.body })
      if (dbImages !== undefined && typeof dbImages === 'string') {
        imagesArray = JSON.parse(dbImages)
      }
      // hasta aca, tengo que en imagesArray o hay un array de imagenes o tengo undefined
      // como manejo el hecho de que me lleguen imagenes ya cargadas y filas nuevas agregadas?
      let nuevoArray: ImagesSchema[] | undefined
      // console.log(files)
      if (files !== undefined && files.length !== 0) {
        // aqui valido si hay files de multer para agregar.
        nuevoArray = await this.service.photoGenerator(
          files as Express.Multer.File[]
        )
        if (nuevoArray != null && imagesArray != null) { nuevoArray = [...nuevoArray, ...imagesArray] } else if (imagesArray != null) nuevoArray = imagesArray
        // logger.debug({ function: 'postController.updade', nuevoArray })
      } else nuevoArray = imagesArray
      console.log(nuevoArray, 'IMAGENES', dbImages, 'dbImages')
      let body = req.body
      if (body !== null && typeof body === 'object' && 'dbImages' in body) {
        body = { ...body, dbImages: undefined }
      }
      const updateDbResponse = await this.service.updatePost(
        body, // as Prisma.PostsUpdateInput,
        id,
        nuevoArray
      )
      if (title === undefined) {
        title = updateDbResponse.data.title as string
      }
      if (heading === undefined) {
        heading = updateDbResponse.data.heading as string
      }
      if (classification === undefined) {
        if (updateDbResponse.data.classification !== undefined) {
          classification = updateDbResponse.data
            .classification as (typeof ClassificationArray)[number]
        } else classification = 'Municipales'
      }
      // ACA DEBO VER LA LOGICA PARA QUE GENERE UN MERGE DE LOS DATOS QUE YA ESTAN EN LA DB Y LO QUE SE VA A ACTUALIZAR
      if (nuevoArray !== undefined && 'fbid' in updateDbResponse.data) {
        const finalResponse = await this.facebookService.updateFacebookPost(
          updateDbResponse.data.fbid as string,
          {
            title,
            heading,
            classification,
            newspaperID: id,
            images: nuevoArray?.map((id) => id.fbid)
          }
        )
        console.log(finalResponse, updateDbResponse)
      }
      //      io.emit('postUpdate', { ...updateDbResponse, images: nuevoArray })
      res.send({ ...updateDbResponse.data, images: nuevoArray })
    },
    public createPost = async (
      req: Request<any, any, CreatePostType['body']>,
      res: Response
    ) => {
      const body = req.body
      const files = req.files
      const dataEmitted = { active: true, body }
      console.log(dataEmitted, 'objeto enviado')
      io.emit('postLoader', dataEmitted)
      console.log('create')
      try {
        let imagesArray
        console.log(files, 'alfo', files?.length)
        if (files !== undefined && Array.isArray(files) && files?.length > 0) {
          console.log('DENTRO DEL PHOTO')
          imagesArray = await this.service.photoGenerator(files)
        }
        if (
          req.user !== undefined &&
          'id' in req.user &&
          typeof req.user.id === 'string'

        ) {
          const responseDB = await this.service.createPost(
            body,
            req.user.id,
            imagesArray as Array<{ fbid: string, url: string }>
          )
          console.log(responseDB, 'Database Response')
          io.emit('postUpdate', {
            ...responseDB,
            images: imagesArray,
            stamp: Date.now()
          })
          console.log({
            ...responseDB,
            images: imagesArray,

            stamp: Date.now()
          }, 'Post creado en la base de datos')
          if (

            responseDB !== undefined &&
            typeof responseDB === 'object' &&
            responseDB !== null &&
            'id' in responseDB &&
            typeof responseDB.id === 'string'
          ) {
            if (imagesArray === undefined) {
              res.status(200).send(responseDB)
              return
            }
            const facebookFeedResponse =
              await this.facebookService.facebookFeed(
                body,
                imagesArray,
                responseDB.id
              )

            if (
              facebookFeedResponse !== undefined &&
              facebookFeedResponse.ok &&
              'id' in facebookFeedResponse.data.data
            ) {
              const fbidUpdate = await this.service.addFBIDtoDatabase(
                facebookFeedResponse?.data.data.id as string,
                responseDB.id
              )
              res.status(200).send(fbidUpdate)
            } else throw new Error('Error Updating Facebook Page Post')
          } else throw new Error('Error updating Database')
        }
      } catch (error) {
        logger.error({ function: 'PostController.createPost', error })
        res.status(404).send(error)
      }
    },
    public getAllPosts = (
      req: Request<any, any, any, GetPostsType['query']>,
      res: Response
    ) => {
      console.log('geting posts', req.user)
      const { cursor, title, search, minDate, maxDate, category } = req.query
      const query: Prisma.PostsFindManyArgs['where'] & {
        AND: Array<Prisma.PostsFindManyArgs['where']>
      } = { AND: [] }

      if (title !== undefined) {
        query.AND.push({
          title: { contains: title }
        })
      }
      if (category !== undefined) {
        query.AND.push({ classification: { contains: category as string } })
      }
      if (search !== undefined) {
        query.AND.push({
          OR: [
            {
              title: search
            },
            {
              text: search
            },
            { heading: search },
            { subTitle: search }
          ]
        })
      }
      if (minDate !== undefined || maxDate !== undefined) {
        query.AND.push({
          AND: []
        })
      }
      if (minDate !== undefined && query !== undefined && 'AND' in query) {
        const data = query.AND[query.AND.length - 1]
        if (data !== undefined && 'AND' in data && Array.isArray(data.AND)) {
          data.AND.push({ createdAt: { gte: new Date(minDate) } })
        }
      }
      if (maxDate !== undefined) {
        const data = query.AND[query.AND.length - 1]
        if (
          data !== undefined &&
          'AND' in data &&
          data?.AND !== undefined &&
          Array.isArray(data.AND)
        ) {
          data.AND.push({ createdAt: { lte: new Date(maxDate) } })
        }
      }
      console.log(query, query.AND[0])
      this.service
        .getPosts(
          {
            cursor:
              cursor === undefined
                ? undefined
                : { createdAt: new Date(cursor) },
            pagination: 50
          },
          query
        )
        .then(async (response) => {
          if (response !== undefined && response.ok) {
            const data = response.data
            const checkedResponse = await Promise.all(
              data.map(async (post) => {
                return await this.checkPhotosAge(
                  post?.images // as Prisma.PhotosCreateInput[]
                )
                  .then((checkedPhotos) => {
                    if (checkedPhotos.data !== undefined) {
                      const finalData: Prisma.PhotosCreateInput[] =
                        checkedPhotos.data // as Prisma.PhotosCreateNestedManyWithoutPostsInput
                      console.log(finalData, finalData.length)
                      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
                      post = {
                        ...post,
                        images:
                          finalData.length === 1 && finalData[0] === undefined
                            ? []
                            : finalData
                      } as Prisma.PostsCreateInput
                      return post
                    }
                  })

                  .catch((error) =>
                    logger.error({
                      function: 'PostController.getAllPosts',
                      error
                    })
                  )
              })
            )
            res.status(200).send(checkedResponse)
          }
        })
        .catch((error) => {
          logger.error({ function: 'PostController.getAllPosts', error })
          res.status(404).send(error)
        })
    },
    public getPostById = (
      req: Request<GetPostById['params']>,
      res: Response
    ) => {
      console.log('getbyid')
      const { id } = req.params
      this.service
        .getPost(id)
        .then(async (response) => {
          if (
            response !== undefined &&
            response !== null &&
            'images' in response &&
            Array.isArray(response.images)
          ) {
            this.checkPhotosAge(
              response?.images as Prisma.PhotosCreateInput[]
            )
              .then(
                async (
                  checkedPhotos: GenericResponseObject<
                  Prisma.PhotosCreateInput[]
                  >
                ) => {
                  console.log(checkedPhotos.data, 'LOKO')
                  // aca saqe el ..data hay que ver si sigue funcionando
                  if ('images' in response) {
                    const data = {
                      ...response,
                      images: checkedPhotos.data
                    }
                    res.status(200).send({ error: null, ok: true, data })
                  }
                }
              )
              .catch((error: any) =>
                logger.error({ function: 'PostController.getByid', error })
              )
          } else res.status(404).send(response)
        })
        .catch((error) => {
          logger.error({ function: 'PostController.getPostById', error })
          res.status(404).send(error)
        })
    },
    protected checkPhotosAge = async (
      photosObject: Prisma.PhotosCreateInput[]
    ): Promise<GenericResponseObject<Prisma.PhotosCreateInput[]>> => {
      if (Array.isArray(photosObject)) {
        try {
          let idArray
          let updatedLinksArray
          let dbResponse: unknown[]
          const photoArray = photosObject.filter((photo) => {
            if (
              photo.createdAt !== undefined &&
              Date.now() >
                new Date(photo.createdAt).getTime() + 1000 * 60 * 60 * 24 * 2
            ) {
              return true
            } else return false
          })
          if (Array.isArray(photoArray) && photoArray.length > 0) {
            idArray = photoArray.map((photo) => ({ id: photo.fbid }))
            updatedLinksArray = await this.facebookService.getLinkFromId(
              idArray
            )
            dbResponse = await Promise.all(
              updatedLinksArray.data.map(async (photo) => {
                const response = await this.prisma.$transaction([
                  this.prisma.photos.updateMany({
                    where: { fbid: photo.fbid },
                    data: { url: photo.url }

                  }),
                  this.prisma.photos.findMany({ where: { fbid: photo.fbid } })
                ])
                return response[1][0]
              })
            )
          } else dbResponse = photosObject

          return new ResponseObject(null, true, dbResponse)
        } catch (error) {
          logger.error({ function: 'PostController.checkedPhotos', error })
          return new ResponseObject(error, false, null)
        }
      }
      return new ResponseObject(
        new Error('Error updating photos'),
        false,
        null
      )
    },
    public deletePost = async (req: Request<GetPostById['params']>, res: Response): Promise<void> => {
      const { id } = req.params
      try {
        const { data } = await this.service.deleteById(id)
        const { audio } = data
        if (Array.isArray(audio) && audio.length > 0) {
          audio.forEach(async item => await this.googleService.fileRemove(item.driveId))
        }
        let fbResponse
        if (data.fbid !== null && typeof data.fbid === 'string') fbResponse = await this.facebookService.deleteFacebookPost(data.fbid)
        logger.debug({ function: 'PostController.deletePost', response, fbResponse })
        res.status(200).send(response)
      } catch (error) { logger.error({ function: 'postController.deletePost', error }) }
    },
    public hidePost = async (req: Request<GetPostById['params']>, res: Response): Promise<void> => {
      const { id } = req.params
      try {
        const response = await this.service.hidePost(id)
        logger.debug({ function: 'PostController.hidePost', response })
        res.status(200).send(response)
      } catch (error) { logger.error({ function: 'postController.hidePost', error }) }
    },
    public showPost = async (req: Request<GetPostById['params']>, res: Response): Promise<void> => {
      const { id } = req.params
      try {
        const response = await this.service.showPost(id)
        logger.debug({ function: 'PostController.showPost', response })
        res.status(200).send(response)
      } catch (error) { logger.error({ function: 'postController.showPost', error }) }
    },
    public uploadAudio = async (req: Request, res: Response) => {
      try {
        if (req.files !== undefined && Array.isArray(req.files)) {
          req.files?.forEach(async (file) => {
            const id = await this.googleService.fileUpload('audio', file.path)
            if (id instanceof TokenError || id instanceof NeverAuthError) {
              res.status(401).json(id)
              return
            } else if (id instanceof GoogleError) {
              res.status(500).json(id)
              return
            }
            if (id !== undefined) {
              const response = await this.service.addAudioToDB(id)
              if (!(response instanceof Error)) {
                res.status(200).json(response)
              } else if (response instanceof PrismaError) res.status(500).send(response)
            } else res.json(500).send(new Error('Couldnt upload file'))
          })
        }
      } catch (error) {
        logger.error({ function: 'postController.uploadAudio', error })
        console.log('se dirije al catch')
        res.status(500).json(error)
      }
    },
    public eraseAudio = async (req: Request<any, any, any, { id: string }>, res: Response) => {
      try {
        const { id } = req.query
        const driveId = await this.prisma.audio.delete({ where: { id }, select: { driveId: true } })
        if (driveId === undefined || typeof driveId !== 'object') throw new Error('Unable to erase from database')
        const response = await this.googleService.fileRemove(driveId.driveId)
        if (response) res.status(200).send(response)
        else throw new Error('Unable to erase de drive Image')
      } catch (error) {
        logger.error({ function: 'postController.eraseAudio', error })
        res.status(500).send(error)
      }
    },
    public videoUpload = async (req: Request<any, any, VideoUpload['body']>, res: Response) => {
      try {
        const { file, body: { title, description, tags, url } } = req
        const { username } = req.user as any
        if (url !== undefined) {
          const createResponse =
            await this.service.prisma.video.create(
              {
                data:
                {
                  url,
                  author:
                  {
                    connect:
                    { username }
                  }
                }
              })
          if (createResponse !== undefined && createResponse !== null) {
            res.status(200).send(createResponse)
            return
          } else {
            res.status(500).send({
              error: new Error('Error al escribir la base de datos'),
              code: 4001
            })
          }
          return
        }

        if (file === undefined) {
          res.status(404).send({
            error: new Error('Error al escribir la base de datos'),
            code: 4002
          })
          return
        }
        const response =
          await this.googleService.uploadVideo(
            file.path,
            title,
            description,
            process.env.YOUTUBE_CHANNEL,
            tags)
        if (response instanceof GoogleError) {
          res.status(500).send(response)
          return
        }
        const dbResponse = await this.service.prisma.video.create({ data: { youtubeId: response, author: { connect: { username } } } })
        if (dbResponse !== undefined && dbResponse !== null) {
          res.status(200).send(dbResponse)
          return
        } else {
          res.status(500).send({
            error: new Error('Error al escribir la base de datos'),
            code: 4001
          })
          return
        }
      } catch (error) {
        logger.error({ function: 'postController.videoUpload', error })
      }
    }
  ) {}
}
