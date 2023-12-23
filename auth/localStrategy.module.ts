/* eslint-disable @typescript-eslint/no-misused-promises */
import passport from 'passport'
import { Strategy } from 'passport-local'
import { AuthService } from './auth.service'
const authService = new AuthService()
passport.use('login', new Strategy({ passReqToCallback: true }, authService.localLoginVerify))
passport.use('register', new Strategy({ passReqToCallback: true }, authService.localSignUpVerify))
