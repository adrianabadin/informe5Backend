/* eslint-disable @typescript-eslint/prefer-optional-chain */
/* eslint-disable @typescript-eslint/no-misused-promises */
import { type Request, type Response } from 'express'
import { PostService } from './post.service'
import { type Prisma } from '@prisma/client'
import { GoogleService } from '../google/google.service'
import { FacebookService } from '../Services/facebook.service'
import { logger } from '../Services/logger.service'
import { type GenericResponseObject, ResponseObject } from '../Entities/response'
import { type CreatePostType, type GetPostsType } from './post.schema'
export class PostController {
  constructor (
    protected service = new PostService(),
    protected googleService = new GoogleService(),
    protected facebookService = new FacebookService(),
    public createPost = async (req: Request<any, any, CreatePostType>, res: Response) => {
      const body = req.body
      const files = req.files
      const dataArray: any = []
      console.log('createPost', body, files)

      // primero se valida que hayan archivos adjuntos en la nota y en el caso de que sea un array de files toma la primera via
      // como multer puede tener un objeto con un array de files o un array de files directamente se arma el condicional que valida el
      // tipo de request y luego continua con la generacion de los datos
      if (files !== undefined && Array.isArray(files)) {
        // por cada archivo que tenga adjunto hago un request a facebook para guardar el archivo no publicado y obtengo un ID
        files.forEach(async (file, index): Promise<any> => {
          try {
            const response = await this.facebookService.postPhoto(file)
            if (response.ok) {
              // uso el id que me devuele la funcion facebook postPhoto para obtener el link publico de esa imagen
              try {
                const link = await this.facebookService.getLinkFromId(response)
                console.log(link, 'Texto')
                if (link.ok) dataArray.push({ url: link.data.url, fbid: link.data.fbid })
              } catch (error) { logger.error({ function: 'PostController.create.getLink', error }) }
              // en el caso de que esta sea la ultima vuelta del forEach genero los post y devuelvo el response
              if (index === files.length - 1) {
                // crear el post en la base de datos
                let postResponse
                if ((req.user !== undefined && 'id' in req.user)) {
                  postResponse = await this.service.createPost(body, req.user.id as string /* '62d7d65d-0ba1-4f2c-8ade-818c7e36d92a' */, dataArray)
                  const finalRequest = await this.facebookService.facebookFeed(body, dataArray, postResponse.data.id)
                  console.log(finalRequest)
                } else { res.status(401).send({ error: 'Unauthorized User' }) }
                console.log('database response', postResponse)
                res.status(200).send(postResponse)
              }
              // en el caso de que el response no fue ok , no agrego nada al array y verifico si es la ultima vuelta del each tambien
              // termino el request
            } else if (index === files.length - 1) res.status(200).send(dataArray)
          } catch (error) { logger.error({ function: 'PostController.create.postPhto', error }) }
        })
      } else {
        if (files !== undefined) {
          // en el caso de que multer devuelva un objeto con un array de files obtengo la key de ese objeto y luego itero dentro de lla

          Object.keys(files).forEach(field => {
            files[field].forEach(async (file, index) => {
              // aqui llamo a fb para subir la foto
              let response
              try {
                response = await this.facebookService.postPhoto(file)

                if (response.ok) {
                  // si el response es ok uso el id para obtener el link publico
                  let link
                  try {
                    link = await this.facebookService.getLinkFromId(response)
                    if (link.ok) { dataArray.push(link.data) }
                  } catch (error) { logger.error({ function: 'PostController.create.getLink', error }) }

                  // si es la ultima  iteracion termina el request
                  if (index === files[field].length - 1) {
                    res.status(200).send(dataArray)
                  }
                  // si hubo algun problema en el request a fb se fija si es la ultima iteracion y termina el request en ese caso
                } else if (index === files[field].length - 1) res.status(200).send(dataArray)
              } catch (error) { logger.error({ function: 'PostController.create.postPhoto', error }) }
            })
          })
        }
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
    public getPostById = (req: Request, res: Response) => {
      console.log('getbyid')
      const { id } = req.params
      this.service.getPost(id, { images: true }).then(async (response) => {
        if (response?.ok !== undefined && response.ok && 'data' in response) {
          this.checkPhotosAge(response?.data.images).then(async (checkedPhotos: GenericResponseObject<Prisma.PhotosCreateInput[]>) => {
            console.log(checkedPhotos.data, 'LOKO')
            response.data = { ...response.data, images: checkedPhotos.data }
            res.status(200).send(response)
          }).catch((error: any) => logger.error({ function: 'PostController.getByid', error }))
        } else res.status(404).send(response)
      }).catch(error => {
        logger.error({ function: 'PostController.getPostById', error })
        res.status(404).send(error)
      })
    }, protected checkPhotosAge = async (photosObject: Prisma.PhotosCreateInput[]): Promise<GenericResponseObject<Prisma.PhotosCreateInput[]>> => {
      if (Array.isArray(photosObject)) {
        const data = await Promise.all(photosObject.map((photo): any => {
          if (photo?.id !== null) {
            if (photo.updatedAt instanceof Date) {
              if (photo.updatedAt !== null && photo.updatedAt instanceof Date && Date.now() - photo.updatedAt.getTime() > 1000 * 60 * 60 * 24 * 2) {
                return this.facebookService.getLinkFromId(new ResponseObject(null, true, { ...photo, id: photo.fbid }))
                  .then(async (response) => {
                    console.log(response)
                    if (response.ok) {
                      return await this.service.updatePhoto({ ...photo, url: response.data.url })
                        .then(updatephotoResponse => updatephotoResponse)
                        .catch(error => {
                          logger.error({ function: 'PostController.checkPhotosAge.updatePhoto', error })
                        })
                    }
                  }
                  )
                  .catch(error => {
                    logger.error({ function: 'Post.controller.checkphotoage.getLinkFromId', error })
                  })
              } else return photo
            } else return undefined
          } else return undefined
        }))
        return new ResponseObject(null, true, data)
      }
      return new ResponseObject('Unespected Error', false, null)
    }
  ) {

  }
}
