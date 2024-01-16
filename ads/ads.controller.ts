import { type Request, type Response } from 'express'
import { AdsService } from './ads.service'
import { type createAdType } from './ads.schema'
import { logger } from '../Services/logger.service'
import { ResponseObject } from '../Entities'
import { Multer } from 'multer'
import express from 'express'

const adsServiceLoad = new AdsService()
export class AdsController {
  service = new AdsService()
  constructor () {
    this.service = adsServiceLoad
    this.createAd = this.createAd.bind(this)
    this.getAds = this.getAds.bind(this)
    this.setActive = this.setActive.bind(this)
    this.setInactive = this.setInactive.bind(this)
    this.deleteAd = this.deleteAd.bind(this)
    this.getAd = this.getAd.bind(this)
    this.updateAd = this.updateAd.bind(this)
  }

  async createAd (req: Request<any, any, createAdType & { photoUrl: string }>, res: Response): Promise<void> {
    console.log('valido')
    try {
      const response = await this.service.createAd({ ...req.body, photoUrl: req.file?.filename as string })
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

  async setActive (req: Request<{ id: string }>, res: Response): Promise<void> {
    console.log(req.params, 'cosas')
    try {
      const response = await this.service.setActive(req.params.id)
      console.log(response, req.params.id, 'texo')
      res.status(200).send(response)
    } catch (error) {
      logger.error({ function: 'AdsController.setActive', error })
      res.status(400).send(new ResponseObject(error, false, null))
    }
  }

  async setInactive (req: Request<{ id: string }>, res: Response): Promise<void> {
    console.log(req.params)
    try {
      const response = await this.service.setInactive(req.params.id)
      res.status(200).send(response)
    } catch (error) {
      logger.error({ function: 'AdsController.setInactive', error })
      res.status(400).send(new ResponseObject(error, false, null))
    }
  }

  async deleteAd (req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params
      const response = await this.service.deleteAd(id)
      res.status(200).send(response)
    } catch (error) {
      logger.error({ function: 'adsController.delete', error })
      res.status(404).send({ error, ok: false, data: null })
    }
  }

  async getAd (req: Request, res: Response): Promise<void> {
    try {
      const response = await this.service.getAd(req.params.id)
      res.status(200).send(response)
    } catch (error) {
      logger.error({ function: 'AdsController.getAd', error })
      res.status(404).send(error)
    }
  }

  async updateAd (req: Request, res: Response): Promise<void> {
    try {
      console.log(req.body, 'text', req.params, req.file)

      const { photoUrl } = req.body
      let filename
      if (req.file !== undefined) { filename = req.file.filename as any }

      const response = await this.service.updateAd({ ...req.body, photoUrl: filename !== undefined ? filename : photoUrl }, req.params.id)
      console.log(photoUrl, filename, response)
      res.status(200).send(response)
    } catch (error) {
      logger.error({ function: 'AdsController.updateAd', error })
      res.status(404).send({ error, ok: false, data: null })
    }
  }
}
