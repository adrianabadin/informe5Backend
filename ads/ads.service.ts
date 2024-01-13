import { DatabaseHandler } from '../Services/database.service'
import { logger } from '../Services/logger.service'
import { type createAdType } from './ads.schema'
import { type GenericResponseObject, ResponseObject, type GenericResponseObject } from '../Entities/response'

export class AdsService extends DatabaseHandler {
  constructor (
    public createAd = async <T>(data: createAdType): Promise<GenericResponseObject<T | null>> => {
      try {
        const response = await this.prisma.ads.create({ data: { importance: data.importance, photoUrl: data.photoUrl, title: data.title, url: data.url, user: { connect: { id: data.usersId } } } })
        return new ResponseObject(null, true, response as T)
      } catch (error) {
        logger.error({ function: 'AdsService.createAd', error })
        return new ResponseObject(error, false, null)
      }
    },
    public getAds = async () => {
      try {
        const response = await this.prisma.ads.findMany({})
        return new ResponseObject(null, true, response)
      } catch (error) {
        logger.error({ function: 'AdsService.getAds', error })
        return new ResponseObject(error, false, null)
      }
    }
  ) { super() }
}
