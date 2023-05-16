import passport from 'passport'
import { AuthService } from './auth.service'
import googleOauth from 'passport-google-oauth2'
import { type Request } from 'express'
import { logger } from '../Services/logger.service'
const Strategy = googleOauth.Strategy
const authService = new AuthService()
console.log('cargando oauth')
passport.use(new Strategy({
  clientID: process.env.CLIENTID as string, clientSecret: process.env.CLIENTSECRET as string, callbackURL: 'http://localhost:8080/auth/google/getuser', scope: 'profile', passReqToCallback: true

}, authService.googleAuthVerify))
// process.env.CALLBACKURL as string,
// authService.googleAuthVerify))
/*
{
  clientID: process.env.CLIENTID as string,
  callbackURL: 'http://localhost:8080/auth/google/getuser',
  clientSecret: process.env.CLIENTSECRET as string,
  scope: ['profile']}
*/
