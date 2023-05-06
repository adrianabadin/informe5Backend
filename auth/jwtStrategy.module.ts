/* eslint-disable @typescript-eslint/no-misused-promises */
import { Strategy, ExtractJwt } from 'passport-jwt'
import passport from 'passport'
import { AuthService } from './auth.service'
import { type Request } from 'express'
import fs from 'fs'
const publicKey = fs.readFileSync(`/${process.env.KEYS_PATH as string}/publicKey.pem`, 'utf-8')
const authService = new AuthService()
const cookieExtractor = (req: Request): string => {
  let token: string = ''
  if (req.cookies !== undefined) {
    token = req.cookies('jwt')
  }
  return token
}
passport.use(new Strategy({
  jwtFromRequest: ExtractJwt.fromExtractors([cookieExtractor]),
  secretOrKey: publicKey,
  algorithms: ['RS256'],
  passReqToCallback: true
}, authService.jwtLoginVerify))
