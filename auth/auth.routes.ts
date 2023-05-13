import { Router } from 'express'
import { AuthController } from './auth.controller'
import { type Request, type Response } from 'express'
import passport from 'passport'
import { loginValidator } from './login.validate'
import { signupValidator } from './signup.validator'
export const authRoutes = Router()
const authController = new AuthController()
authRoutes.post('/login', passport.authenticate('login'), authController.issueJWT, (req: Request, res: Response) => {
  if (req.isAuthenticated()) {
    res.status(200).send(JSON.stringify(req.user))
  } else res.status(404).send({ ok: false, message: 'Invalid Credentials' })
}) //, { failureFlash: true, failureRedirect: '/failedlogin', successRedirect: '/' }
authRoutes.post('/signup', passport.authenticate('register', { failureFlash: true, failureRedirect: '/failedsignup', successRedirect: '/' }))
authRoutes.get('/goauth', passport.authenticate('google', { successRedirect: '/', failureFlash: true, failureRedirect: '/signup' }))

/**
 * Failed Login And Signup
 */

authRoutes.get('/failedlogin', () => {
  console.log('Failed Login')
})
