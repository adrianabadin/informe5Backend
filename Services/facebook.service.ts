import dotenv from 'dotenv'
import axios from 'axios'
import fs from 'fs'
import { type IFacebookData, ResponseObject } from '../Entities'
import { logger } from './logger.service'
import { type GenericResponseObject, ResponseObject } from '../Entities/response'
dotenv.config()
export class FacebookService {
  constructor (
    public pageID = (process.env.FACEBOOK_PAGE != null) ? process.env.FACEBOOK_PAGE : 'me',
    public pageToken = (process.env.FB_PAGE_TOKEN !== null) ? process.env.FB_PAGE_TOKEN : '',
    public postPhoto = async (data: Express.Multer.File) => {
      let response
      if (this.pageToken === undefined || this.pageID === undefined) throw new Error('Must Provide Fb Credentials on enviromen Variables')

      try {
        response = await axios.post(`https://graph.facebook.com/${this.pageID}/photos?published=false&access_token=${this.pageToken}`, { source: fs.createReadStream(data.path) }, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }).then(response => {
          fs.unlinkSync(data.path)
          console.log(data.path, 'File Deleted?', response)
          return response.data
        }).catch(error => {
          logger.error({ function: 'FacebookService.postPhoto.axiosPostRequest', error })
          if (fs.existsSync(data.path)) { fs.unlinkSync(data.path) }
          return new ResponseObject(error, false, null)
        })
      } catch (error) {
        logger.error({ function: 'FacebookService.postPhoto.axiosPostRequest', error })
        if (fs.existsSync(data.path)) { fs.unlinkSync(data.path) }
        return new ResponseObject(error, false, null)
      }
      // console.log(response)
      return new ResponseObject(null, true, response)
    },
    public getLinkFromId = async (idArray: Array<{ id: string } | undefined>): Promise<GenericResponseObject<Array<{ fbid: string, url: string }>>> => {
      try {
        const imagesArray: Array<{ fbid: string, url: string }> = []
        if (idArray !== undefined && Array.isArray(idArray)) {
        // https://graph.facebook.com/391159203017232?fields=link&access_token=EAAC6VEEU92EBAMdz1ZAcWHS199UPlJqArvcZCkVVOT5vF9sZBYzMixo4IoNTnguXZB2BCb3Ui3jhGUGIIKGEtIx8ZC3iiMlpuXUNZBWHaDEJjif0M04jLyPhBCISHvnOY9oYIuj1Qrz5ZBlH63pMN3G3kB0AzioZAZCKd3HyA1Swl0mEO9Dg8k3WgqG5WrqLZANM9uEkcrn7IFjAZDZD
          if (this.pageToken !== '') {
            // TRABAJAR EN ESTE REQUEST PARA QUE DEVUELVA SOLO LA IMAGEN DE MAYOR RESOLUCION YAMODIFIQUE LINK POR IMAGES QUE DEVUELVE EL LINK PUBLICO
            // DE LA IMAGEN DE FACEBOOK
            const batch: any[] = []
            idArray.forEach((id) => {
              if (id !== undefined) {
                batch.push({
                  method: 'GET',
                  relative_url: `${id.id}?fields=images`
                })

                console.log(id.id)
              }
            })
            const response = await axios.post('https://graph.facebook.com/', { batch }, { headers: { 'Content-Type': 'application/json' }, params: { access_token: this.pageToken } })
            // VALIDA QUE EL RESPONSE GENERAL SEA OK
            if (response.status === 200) {
              // VALIDA QUE HAYA DEVUELTO UN ARRAY DE RESPUESTAS
              if (Array.isArray(response.data) && response.data.length > 0) {
                // TOMA CADA RESPUESTA QUE DIO EL BATCH REQUEST Y LA PROCESA
                response.data.forEach((image: unknown) => {
                  // VALIDA QUE LA RESPUESTA SEA UN OBJETO Y QUE CONTENGA LAS PROPIEDADES QUE VAMOS A USAR
                  if (typeof image === 'object' && image !== null && 'code' in image && 'body' in image && typeof image?.body === 'string') {
                    // VALIDA QUE LA RESPUESTA DE ESTA REQUEST EN PARTICULAR SEA OK
                    if (image.code === 200) {
                      const imagesFromFB: unknown = JSON.parse(image.body)
                      // VALIDA QUE ESTA REQUEST TENGA UNA KEY IMAGES DE TIPO ARRAY Y UNA ID DE TIPO STRING
                      if (imagesFromFB !== null && typeof imagesFromFB === 'object' && 'images' in imagesFromFB && 'id' in imagesFromFB && typeof imagesFromFB.id === 'string' && Array.isArray(imagesFromFB.images)) {
                        let found720: boolean = false
                        let accu: number = 0
                        let indexAcc: number = 0
                        // RECORRE LAS IMAGENES DE ESA REQUEST Y TOMA EL NUMERO DE INDICE DE ESE ARRAY PARA GENERAR UN ACUMULADOR QUE NOS DEJE LUEGO ACCEDER A LA IMAGEN DE MAS RESOLUCION
                        imagesFromFB.images.forEach((photo: unknown, subIndex) => {
                          // VALIDA LOS CAMPOS HEIGHT WIDTH Y SOURCE Y VALIDA SUS TIPOS
                          if (typeof photo === 'object' && photo !== null && 'height' in photo && 'width' in photo && typeof photo.height === 'number' && typeof photo.width === 'number') {
                            // GENERA EL ACUMULADOR4 DE MAYOR RESOLUCION Y EL INDICE DEL DE MAYOR RESOLUCION
                            if (photo.height * photo.width >= accu) {
                              accu = photo.height * photo.width
                              indexAcc = subIndex
                            }
                            // SI LA RESOLUCION ES DE 720*480 O DE 480*720 PUSHEA EL OBJETO AL ARRAY Y CAMBIA A TRUE FOUND720
                            if (photo.height * photo.width === 480 * 720 && 'source' in photo) {
                              imagesArray.push({ fbid: imagesFromFB.id as string, url: photo.source as string })
                              found720 = true
                            }
                          }
                        })
                        // EN EL CASO DE QUE EL ARRAY NO CUENTE CON LA RESOLUCION BUSCADA PUSHEA LA DE MAYOR RESOLUCION
                        if (!found720) {
                          imagesArray.push({ fbid: imagesFromFB.id, url: imagesFromFB.images[indexAcc].source })
                        }
                      }
                      logger.debug({ function: 'facebookService.getLinkFromId', imagesArray })
                      // hace el return de un response Object con un imagesArray Type
                    }
                  }
                })
              }
            } else throw new Error(response.data)
          } else throw new Error('Must provide a facebook Token')
        }
        if (imagesArray.length > 0) {
          return new ResponseObject(null, true, imagesArray)
        } else throw new Error('Error creating link from id array')
      } catch (error) {
        logger.error({ function: 'facebookService.getLinkFromId', error })
        return new ResponseObject(error, false, null)
      }
    },
    //       // const response = await axios.get(`https://graph.facebook.com/${id.data.id as string}?fields=images&access_token=${this.pageToken as string}`)
    //       if ('error' in response && response.error !== undefined && response.error !== null && typeof response.error === 'object') {
    //         if ('code' in response.error && typeof response.error.code === 'string' && 'message' in response.error) {
    //           throw new Error(`Codigo de error: ${response.error.code} ${response.error.message as string}`)
    //         }
    //       } else if ('images' in response?.data) {
    //         if (Array.isArray(response?.data.images) && response?.data.images.length > 0) {
    //           console.log('images es array')
    //           const responseTyped: { images: Array<{ width: number, heigth: number, source: string }> } = response.data as { images: Array<{ width: number, heigth: number, source: string }> }
    //           let data: Array<{ width: number, heigth: number, source: string }> | { width: number, heigth: number, source: string } = responseTyped.images.filter(image => image.heigth === 720 && image.width === 480)
    //           if (data.length > 0 && 'source' in data) {
    //             return new ResponseObject(null, true, { url: data.source, fbid: id.data.id })
    //           } else {
    //             data = responseTyped.images.filter(image => image.heigth === 480 && image.width === 720)
    //             if (data.length > 0 && 'source' in data) {
    //               return new ResponseObject(null, true, { url: data.source, fbid: id.data.id })
    //             } else {
    //               data = responseTyped.images.reduce((max, objeto) => {
    //                 if (objeto.heigth * objeto.width > max.heigth * max.width) {
    //                   return objeto
    //                 } else return max
    //               })
    //               if (typeof data.source === 'string' && data.source !== null) {
    //                 return new ResponseObject(null, true, { url: data.source, fbid: id.data.id })
    //               } else return new ResponseObject('Unable to find an image source', false, null)
    //             }
    //           }
    //         } else return new ResponseObject('Unable to find an image source', false, null)
    //       } return new ResponseObject('Unable to find an image source', false, null)
    //     } catch (error: any) {
    //     //  logger.error({ function: 'FacebookService.getLinkFromId.axiosRequest', error })
    //       logger.error({ function: 'FacebookService.getLinkFromId.axiosPostRequest', error: error?.response.data.error })
    //       return new ResponseObject(error?.response.data.error, false, null)
    //     }
    //   } else {
    //     logger.error({ function: 'FacebookService.getLinkFromId', error: 'Must provide a page Token' })
    //     return new ResponseObject('Must provide a page Token', false, null)
    //   }
    // } else {
    //   logger.error({ function: 'FacebookService.getLinkFromId', error: 'Parameter missmatch shpuld be a ResponseObject' })
    //   return new ResponseObject('Parameter missmatch shpuld be a ResponseObject', false, null)
    // }
    // },
    public facebookFeed = async (data: IFacebookData, pictures: Array<{ url: string, fbid: string }>, id: string) => {
      let response
      try {
        console.log(data, pictures)
        const { title, heading } = data
        const message: string =
          `${title}\n${heading}\n\nPara leer mas click en el link  ${process.env.NEWSPAPER_URL as string}/${id}`
        const pictsArray = pictures.map((picture) => {
          return picture.fbid // picture.url.split('fbid=')[1].split('&')[0]
        })
        let dataRequest
        if (process.env.NEWSPAPER_URL !== undefined) {
          dataRequest = {
            message,
            attached_media: pictsArray.map(id => ({ media_fbid: id })),
            access_token: process.env.FB_PAGE_TOKEN
          }
        }
        console.log(dataRequest, 'DataRequest Var')
        try {
          response = await axios.post(` https://graph.facebook.com/${process.env.FACEBOOK_PAGE as string}/feed`, dataRequest)
          return new ResponseObject(null, true, response)
        } catch (error) { console.log(error) }
      } catch (error) {
        logger.error({ function: 'FacebookService.facebookFeed', error })
        return new ResponseObject(error, false, null)
      }
    },
    public updateFacebookPost = (id:string,data:{title:string,heading:string,classification:string,newspaperID:string,images:string[]) => {}
    
  ) { }
}
