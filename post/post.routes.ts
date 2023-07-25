/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable @typescript-eslint/restrict-plus-operands */
import { Router, type Request } from 'express'
import multer from 'multer'
import { PostController } from './post.controller'
import passport from 'passport'
import { postValidation } from './post.validation'
import { getPostsSchema, getPostById, createPostSchema } from './post.schema'
import { schemaValidator } from '../middlewares/zod.validate'

const postController = new PostController()
const storage = multer.diskStorage({
  destination: function (_req: Request, _file: Express.Multer.File, cb: (...arg: any) => any) {
    cb(null, './public/temp')
  },
  filename: function (_req: Request, file: Express.Multer.File, cb: (...args: any) => any) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + '-' + file.originalname)
  }
})
const upload = multer({ storage })
export const postRouter = Router()
postRouter.post('/create',
  upload.array('images', 5),
  schemaValidator(createPostSchema),
  passport.authenticate('jwt', { session: false }),
  postController.createPost)
postRouter.get('/getPostById/:id',
  schemaValidator(getPostById),
  postController.getPostById)
postRouter.get('/getPosts',
  schemaValidator(getPostsSchema),
  postController.getAllPosts)
