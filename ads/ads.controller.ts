import { type Request, type Response } from 'express'
import { AdsService } from './ads.service'
import { type createAdType } from './ads.schema'
import { Multer } from 'multer'
import { logger } from '../Services/logger.service'
const adsServiceLoad = new AdsService()
export class AdsController {
  service = new AdsService()
  constructor () {
    this.service = adsServiceLoad
    this.createAd = this.createAd.bind(this)
    this.getAds = this.getAds.bind(this)
  }

  async createAd (req: Request<any, any, createAdType & { photoUrl: string }>, res: Response): Promise<void> {
    console.log('valido')
    try {
      const response = await this.service.createAd({ ...req.body, photoUrl: req.file?.path })
      res.status(200).send({ error: null, ok: true, data: response })
    } catch (error) {
      logger.error({ function: 'AdsController.createAd', error })

      res.status(500).send({ error, ok: false, data: null })
    }
  }

  async getAds (_req: Request, res: Response): Promise<void> {
    try {
      const response = await this.service.getAds()
      res.status(200).send(response)
    } catch (error) {
      logger.error({ function: 'AdsController.getAds', error })
      res.status(400).send({ error, ok: false, data: null })
    }
  }
}
