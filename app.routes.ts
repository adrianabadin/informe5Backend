
import { type Request, type Application, type Response } from 'express'
import { authRoutes } from './auth/auth.routes'
export function routeHandler (app: Application): void {
  app.use('/auth', authRoutes)
  app.use('/', (req: Request, res: Response) => {
    console.log('root')
  })
}
