
import { type Application } from 'express'
import { authRoutes } from './auth/auth.routes'
export function routeHandler (app: Application): void {
  app.use('/auth', authRoutes)
}
