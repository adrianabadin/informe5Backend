import { Router } from 'express'
// import { AuthController } from './auth.controller'
import passport from 'passport'
import { loginValidator } from './login.validate'
import { signupValidator } from './signup.validator'
export const authRoutes = Router()
authRoutes.post('/login', loginValidator, passport.authenticate('login', { failureFlash: true, failureRedirect: '/failedlogin', successRedirect: '/' }))
authRoutes.post('/signup', signupValidator, passport.authenticate('register', { failureFlash: true, failureRedirect: '/failedsignup', successRedirect: '/' }))
authRoutes.get('/goauth', passport.authenticate('google', { successRedirect: '/', failureFlash: true, failureRedirect: '/signup' }))

/**
 * Failed Login And Signup
 */

authRoutes.get('/failedlogin', () => {
  console.log('Failed Login')
})
