
import { type Request, type Application, type Response } from 'express'
import { authRoutes } from './auth/auth.routes'
import { postRouter } from './post/post.routes'
export function routeHandler (app: Application): void {
  app.use('/auth', authRoutes)
  app.use('/post', postRouter)
  app.use('/', (req: Request, res: Response) => {
    console.log('root')
  })
}
