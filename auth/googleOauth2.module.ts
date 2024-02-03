import passport from 'passport'
import { AuthService } from './auth.service'
import googleOauth from 'passport-google-oauth2'
import { type Request } from 'express'
import { logger } from '../Services/logger.service'
import { ActionCreatorWithPayload } from '@reduxjs/toolkit'
const Strategy = googleOauth.Strategy
const authService = new AuthService()
console.log('cargando oauth')
passport.use(new Strategy({
  clientID: process.env.CLIENTID,
  clientSecret: process.env.CLIENTSECRET,
  callbackURL: 'http://localhost:8080/auth/google/getuser',
  scope: ['openid', 'email', 'profile'],

  passReqToCallback: true
}, authService.googleAuthVerify))

// passport.use('inner', new Strategy({
//   clientID: process.env.CLIENTID_BUCKET,
//   clientSecret: process.env.CLIENTSECRET_BUCKET,
//   callbackURL: process.env.CALLBACK_BUCKET,
//   scope: ['openid', 'email', 'profile'],
//   passReqToCallback: true
// }, authService.googleAuthVerify))
