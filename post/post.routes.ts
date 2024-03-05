/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable @typescript-eslint/restrict-plus-operands */
import { Router, type Request } from 'express'
import multer from 'multer'
import { PostController } from './post.controller'
import passport from 'passport'
import { getPostById, createPostSchema, videoUploadSchema, videoEraseSchema } from './post.schema'
import { schemaValidator } from '../middlewares/zod.validate'
import { AuthController } from '../auth/auth.controller'
const authController = new AuthController()
const postController = new PostController()
const storage = multer.diskStorage({
  destination: function (
    _req: Request,
    _file: Express.Multer.File,
    cb: (...arg: any) => any
  ) {
    cb(null, './public/temp')
  },
  filename: function (
    _req: Request,
    file: Express.Multer.File,
    cb: (...args: any) => any
  ) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    cb(null, file.fieldname + '-' + uniqueSuffix + '-' + file.originalname)
  }
})
export const upload = multer({ storage })
export const postRouter = Router()
/**
 * AUDIO ROUTES
 */
postRouter.post('/audio', upload.array('audio'), postController.uploadAudio)
postRouter.delete('/audioRemove', postController.eraseAudio)
postRouter.get(
  '/getPostById/:id',
  schemaValidator(getPostById),
  postController.getPostById
)
/**
 * VIDEO ROUTES
 */
postRouter.post(
  '/videoAdd',
  upload.single('video'),
  passport.authenticate('jwt', { session: false }),
  authController.jwtRenewalToken,

  postController.videoUpload)
postRouter.delete('/videoRm',
  schemaValidator(videoEraseSchema),
  passport.authenticate('jwt', { session: false }),
  postController.eraseVideo)

/**
 * POST ROUTES
 */
postRouter.post(
  '/create',
  upload.array('images', 5),
  passport.authenticate('jwt', { session: false }), authController.jwtRenewalToken,
  schemaValidator(createPostSchema),
  postController.createPost
)
postRouter.get('/getIds', postController.getPostsIds)
postRouter.get(
  '/getPosts',
  /* schemaValidator(getPostsSchema), */
  postController.getAllPosts
)
postRouter.get('/get30days', postController.get30DaysPosts)
postRouter.put(
  '/updatePost/:id', passport.authenticate('jwt', { session: false }), authController.jwtRenewalToken,
  upload.array('images', 5),
  postController.updatePost
)
// postRouter.put('/hidePost/:id', passport.authenticate('jwt', { session: false }), authController.jwtRenewalToken, postController.hidePost)
postRouter.delete('/deletePost/:id', passport.authenticate('jwt', { session: false }), authController.jwtRenewalToken, schemaValidator(getPostById), postController.deletePost)
postRouter.put('/hidePost/:id', passport.authenticate('jwt', { session: false }), authController.jwtRenewalToken, schemaValidator(getPostById), postController.hidePost)
postRouter.put('/showPost/:id', passport.authenticate('jwt', { session: false }), authController.jwtRenewalToken, schemaValidator(getPostById), postController.showPost)
