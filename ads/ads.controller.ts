import { type Request, type Response } from 'express'
import { AdsService } from './ads.service'
import { type createAdType } from './ads.schema'
import { Multer } from 'multer'

export class AdsController {
  constructor (protected adsService = new AdsService()) {}
  async createAd (req: Request<any, any, createAdType>, res: Response): Promise<void> {
    try {
      const response = await this.adsService.createAd({ ...req.body, photoUrl: req.file?.path })
      res.status(200).send({ error: null, ok: true, data: response })
    } catch (error) { res.status(500).send({ error, ok: false, data: null }) }
  }
}
