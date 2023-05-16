import { Router } from 'express'
import { AuthController } from './auth.controller'
import { type Request, type Response } from 'express'
import passport from 'passport'
import dotenv from 'dotenv'
import { AuthService } from './auth.service'
const authService = new AuthService()
dotenv.config()
// import { loginValidator } from './login.validate'
// import { signupValidator } from './signup.validator'
export const authRoutes = Router()
const authController = new AuthController()
authRoutes.post('/token', passport.authenticate('jwt'), authController.jwtLogin)
authRoutes.post('/login', passport.authenticate('login'), authController.localLogin)
authRoutes.post('/signup', passport.authenticate('register', { failureFlash: true, failureRedirect: '/failedsignup', successRedirect: '/' }))
authRoutes.get('/goauth', passport.authenticate('google', { scope: ['profile', 'email'] }), (req: Request, res: Response) => {
  console.log(req.isAuthenticated())
  if (req.isAuthenticated()) res.status(200).send({ message: 'Authenticated' })
  else res.status(401).send({ message: 'unAuthorized' })
})//, { successRedirect: '/', failureFlash: true, failureRedirect: '/signup' }
authRoutes.get('/google/getuser', passport.authenticate('google', { scope: ['profile', 'email'] }), (req: Request, res: Response) => {
  console.log('cb funciona', { auth: req.isAuthenticated(), flash: req.flash() })
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
