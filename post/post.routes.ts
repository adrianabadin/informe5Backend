import { Router } from 'express'
import multer from 'multer'
import { PostController } from './post.controller'
const postController = new PostController()
const upload = multer({ storage: multer.memoryStorage() })
export const postRouter = Router()
postRouter.post('/create', upload.array('images', 5), postController.createPost)
