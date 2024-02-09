import { DatabaseHandler } from '../Services/database.service'
import { logger } from '../Services/logger.service'
import { type createAdType } from './ads.schema'
import { type GenericResponseObject, ResponseObject, type GenericResponseObject } from '../Services/google.errors'
import { type AdsFormType } from '../../Informe5Front/src/ReduxGlobals/Features/adsFormSlice'

export class AdsService extends DatabaseHandler {
  constructor (
    public createAd = async <T>(data: createAdType & { photoUrl: string }): Promise<GenericResponseObject<T | null>> => {
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
    },
    public setActive = async (id: string) => {
      try {
        const result = await this.prisma.ads.update({ where: { id }, data: { isActive: true } })
        return new ResponseObject(null, true, result)
      } catch (error) {
        logger.error({ function: 'AdsService.setActive', error })
        return new ResponseObject(error, false, null)
      }
    },
    public setInactive = async (id: string) => {
      try {
        const result = await this.prisma.ads.update({ where: { id }, data: { isActive: false } })
        return new ResponseObject(null, true, result)
      } catch (error) {
        logger.error({ function: 'AdsService.setInactive', error })
        return new ResponseObject(error, false, null)
      }
    },
    public deleteAd = async (id: string) => {
      try {
        const response = await this.prisma.ads.delete({ where: { id } })
        return new ResponseObject(null, true, response)
      } catch (error) {
        logger.error({ function: 'AdsService.deleteAd', error })
        return new ResponseObject(error, false, null)
      }
    },
    public getAd = async (id: string) => {
      try {
        const response = await this.prisma.ads.findUnique({ where: { id } })
        console.log(response, 'getAd')
        return new ResponseObject(null, true, response)
      } catch (error) {
        logger.error({ function: 'AdsService.getAd', error })
      }
    },
    public updateAd = async (data: AdsFormType & { photoUrl: string }, id: string) => {
      try {
        const response = await this.prisma.ads.update({ where: { id }, data })
        return new ResponseObject(null, true, response)
      } catch (error) {
        logger.error({ function: 'AdsService.updateAd', error })
        return new ResponseObject(error, false, null)
      }
    }
  ) { super() }
}
