import { type NextFunction, Router, type Request, type Response } from 'express'
import { AuthController } from './auth.controller'
import { upload } from '../post/post.routes'
import passport from 'passport'
import dotenv from 'dotenv'
import { userLogged } from '../app'

dotenv.config()
export const authRoutes = Router()
const authController = new AuthController()
authRoutes.post('/token', passport.authenticate('jwt', { session: false }), authController.jwtRenewalToken, authController.sendAuthData)
authRoutes.get('/token', passport.authenticate('jwt', { session: false }), authController.jwtRenewalToken, authController.sendAuthData)
authRoutes.post('/login', passport.authenticate('login'), authController.localLogin)
authRoutes.get('/setcookie', (req: Request, res: Response) => {
  res.cookie('adrian', 'groso')
  res.send({ ok: true })
})
authRoutes.get('/getcookies', (req: Request, res: Response) => {
  res.send({ ok: true, cookie: req.cookies })
})
authRoutes.post('/signup', upload.single('avatar'), passport.authenticate('register', { failureFlash: true, failureRedirect: '/failedsignup' }), authController.localLogin)
authRoutes.get('/goauth', passport.authenticate('google', {
  scope: ['profile', 'email', 'openid'],
  accessType: 'offline',
  prompt: 'consent'
}), authController.gOAuthLogin)//, { successRedirect: '/', failureFlash: true, failureRedirect: '/signup' }
authRoutes.get('/google/getuser', passport.authenticate('google', { scope: ['profile', 'email'] }), authController.gOAuthLogin)
authRoutes.get('/facebook', (req: Request, res: Response, next: NextFunction) => {
  let data
  if (req.query !== undefined) data = req.query
  passport.authenticate('facebook', { scope: ['email'], state: (data != null) ? JSON.stringify(data) : '' })(req, res, next)
})
authRoutes.get('/facebook/callback/', passport.authenticate('facebook'), authController.facebookLogin)

/**
 * Failed Login And Signup
 */

authRoutes.get('/failedlogin', () => {
  console.log('Failed Login')
})
authRoutes.get('/logout', (req: Request, res: Response) => {
  userLogged.id = ''
  userLogged.accessToken = ''
  res.clearCookie('jwt')
})
