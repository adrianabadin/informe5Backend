import { type NextFunction, Router, type Request, type Response } from 'express'
import { AuthController } from './auth.controller'
import { upload } from '../post/post.routes'
import passport from 'passport'
import dotenv from 'dotenv'
import { AuthService } from './auth.service'
import { userLogged } from '../app'
const authService = new AuthService()
dotenv.config()
// import { loginValidator } from './login.validate'
// import { signupValidator } from './signup.validator'
export const authRoutes = Router()
const authController = new AuthController()
authRoutes.post('/token', (req: Request, res: Response, next: NextFunction) => { console.log(req.body); next() }, passport.authenticate('jwt'), authController.jwtLogin)
authRoutes.post('/login', passport.authenticate('login'), authController.localLogin)
authRoutes.post('/signup', upload.single, passport.authenticate('register', { failureFlash: true, failureRedirect: '/failedsignup', successRedirect: '/' }))
authRoutes.get('/goauth', passport.authenticate('google', { scope: ['profile', 'email'] }), authController.gOAuthLogin)//, { successRedirect: '/', failureFlash: true, failureRedirect: '/signup' }
authRoutes.get('/google/getuser', passport.authenticate('google', { scope: ['profile', 'email'] }), (req: Request, res: Response) => {
  let token: string = ''
  if (req.user !== undefined && 'id' in req?.user) { token = authService.tokenIssuance(req.user?.id as string) }
  res.cookie('jwt', token)
  res.redirect('http://localhost:3000')
})
/**
 * Failed Login And Signup
 */

authRoutes.get('/failedlogin', () => {
  console.log('Failed Login')
})
authRoutes.get('/facebook', (req: Request, res: Response, next: NextFunction) => {
  let data
  if (req.query !== undefined) data = req.query
  passport.authenticate('facebook', { scope: ['email'], state: (data != null) ? JSON.stringify(data) : '' })(req, res, next)
}, (_req: Request, _res: Response) => { console.log('logged') })

authRoutes.get('/facebook/callback/', passport.authenticate('facebook'), (req: Request, res: Response) => {
  console.log('authenticated')
  res.send('Auth')
})
authRoutes.get('/user', (req: Request, _res: Response) => { console.log(req.user, 'entro') })
authRoutes.get('/logout', () => {
  userLogged.id = ''
  userLogged.accessToken = ''
})
