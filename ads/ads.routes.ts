/* eslint-disable @typescript-eslint/no-misused-promises */
import { Router, type Request, type NextFunction, type Response } from 'express'
import multer from 'multer'
import { AdsController } from './ads.controller'
import { schemaValidator } from '../middlewares/zod.validate'
import { createAdSchema } from './ads.schema'
import passport from 'passport'
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
export const adsRouter = Router()

adsRouter.post('/create', upload.single('image'),
  schemaValidator(createAdSchema),
  adsController.createAd)
adsRouter.get('/getAll', (req: Request, res: Response, next: NextFunction) => { console.log(req.cookies); next() }, adsController.getAds)
adsRouter.put('/setActive/:id', adsController.setActive)
adsRouter.put('/setInactive/:id', adsController.setInactive)
adsRouter.delete('/delete/:id', adsController.deleteAd)
adsRouter.get('/get/:id', (req: Request, res: Response, next: NextFunction) => { console.log(req.cookies, 'token'); next() }, adsController.getAd)
adsRouter.put('/update/:id', upload.single('image'), adsController.updateAd)
export default adsRouter
