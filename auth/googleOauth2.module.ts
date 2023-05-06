import passport from 'passport'
import { AuthService } from './auth.service'
import { Strategy } from 'passport-google-oauth20'
const authService = new AuthService()
passport.use('google', new Strategy({
  clientID: process.env.CLIENTID as string,
  callbackURL: process.env.CALLBACKURL as string,
  clientSecret: process.env.CLIENTSECRET as string,
  passReqToCallback: true
}, authService.googleAuthVerify))
