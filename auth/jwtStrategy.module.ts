/* eslint-disable @typescript-eslint/no-misused-promises */
import { Strategy, ExtractJwt } from 'passport-jwt'
import passport from 'passport'
import { AuthService } from './auth.service'
import { decrypt } from '../Services/keypair.service'
import { type Request } from 'express'
import fs from 'fs'
import dotenv from 'dotenv'
// import * as jwt from 'jsonwebtoken'
dotenv.config()
const publicKey = fs.readFileSync(`${process.env.KEYS_PATH}/publicKey.pem`, 'utf-8')
const simetricKey = '+vdKrc3rEqncv+pgGy9WmhZXoQfWsPiAuc1UA5yfujE='// process.env.SIMETRICKEY

const authService = new AuthService()
export const cookieExtractor = (req: Request): string => {
  let { jwt: token } = req.cookies
  console.log(token)
  if ('jwt' in req.body && req.body.jwt !== null && token === undefined) { token = req.body.jwt }
  if (token !== undefined) {
    if (simetricKey !== undefined) return decrypt(token, simetricKey)
    else throw new Error('simetricKey is undefined')
  } else throw new Error('Token is undefined')
}
passport.use(new Strategy({
  jwtFromRequest: ExtractJwt.fromExtractors([cookieExtractor]),
  secretOrKey: publicKey,
  algorithms: ['RS256'],
  passReqToCallback: true
}, authService.jwtLoginVerify))
