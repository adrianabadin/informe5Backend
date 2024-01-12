/* eslint-disable @typescript-eslint/no-misused-promises */
import { Router, type Request } from 'express'
import multer from 'multer'
import { AdsController } from './ads.controller'
import { schemaValidator } from '../middlewares/zod.validate'
import { createAdSchema } from './ads.schema'
const adsController = new AdsController()
const storage = multer.diskStorage({
  destination: function (
    _req: Request,
    _file: Express.Multer.File,
    cb: (...arg: any) => any
  ) {
    cb(null, './public')
  },
  filename: function (
    _req: Request,
    file: Express.Multer.File,
    cb: (...args: any) => any
  ) {
    // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    cb(null, file.fieldname + '-' + uniqueSuffix + '-' + file.originalname)
  }
})
export const upload = multer({ storage })
export const router = Router()

router.post('/create', upload.single('image'),
  schemaValidator(createAdSchema),
  adsController.createAd)
