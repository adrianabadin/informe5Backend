import { DatabaseHandler } from '../Services/database.service'
import { logger } from '../Services/logger.service'
import { type createAdType } from './ads.schema'
import { type GenericResponseObject, ResponseObject } from '../Entities/response'

export class AdsService extends DatabaseHandler {
  async createAd <T>(data: createAdType): Promise<GenericResponseObject<T | null>> {
    try {
      const response = await this.prisma.ads.create({ data: { importance: data.importance, photoUrl: data.photoUrl, title: data.title, url: data.url, user: { connect: { id: data.usersId } } } })
      return new ResponseObject(null, true, response as T)
    } catch (error) {
      logger.error({ function: 'AdsService.createAd', error })
      return new ResponseObject(error, false, null)
    }
  }
}
