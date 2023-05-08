import { DatabaseHandler } from '../Services/database.service'
import { logger } from '../Services/logger.service'
import { type Prisma } from '@prisma/client'
import { type Request } from 'express'
import argon2 from 'argon2'
import jwt from 'jsonwebtoken'
import fs from 'fs'
import dotenv from 'dotenv'
import { type DoneType } from '../Entities'
dotenv.config()
const privateKey = fs.readFileSync('auth/privateKey.pem', 'utf-8')
export class AuthService extends DatabaseHandler {
  constructor (
    public localSignUpVerify = async (req: Request, username: string, password: string, done: DoneType) => {
      try {
        let user: Prisma.UsersCreateInput | Prisma.UsersUncheckedCreateInput | null = await this.prisma.users.findUnique({ where: { username } })
        if (user === null) {
          const body: Prisma.UsersCreateInput | Prisma.UsersUncheckedCreateInput = { ...req.body, hash: await argon2.hash(password) }
          if ('password' in body) { delete body.password }
          logger.debug({
            function: 'AuthService.localSignUpVerify', user: { ...body, hash: null }
          })
          user = (await this.prisma.users.gCreate({ ...body })).data
          if (user?.id !== undefined) {
            this.tokenIssuance(user.id, req)
            done(null, user, { message: 'Successfully Registred' })
          } else done(null, false, { message: 'Error in registration' })
        } else done(null, false, { message: 'user exists' })
      } catch (error) {
        logger.error({
          function: 'AuthService.localSignUpVerify', error
        })
        done(error, false, { message: 'Database error' })
      }
    },
    public localLoginVerify = async (req: Request, username: string, password: string, done: DoneType) => {
      try {
        const user: Prisma.UsersCreateInput | Prisma.UsersUncheckedCreateInput = await this.prisma.users.findUniqueOrThrow({ where: { username } })
        if (user !== undefined && 'username' in user && user.username !== null) {
          logger.debug({
            function: 'AuthService.localLoginVerify', user: { ...user, hash: null }
          })
          const isValid: boolean = await argon2.verify(user.hash, password)
          if (isValid) {
            if (user !== null && 'id' in user && user.id !== undefined) {
              this.tokenIssuance(user.id, req)
              done(null, user, { message: 'Successfully Logged In' })
            } else done(null, false, { message: 'Password doesent match' })
          } else done(null, false, { message: 'username doesnt exist' })
        }
      } catch (error) {
        logger.error({ function: 'AuthService.localLoginVerify', error })
        done(error, false, { message: 'Database Error' })
      }
    },
    public tokenIssuance = (id: string, req: Request) => {
      req.cookies.jwt = jwt.sign({ sub: id }, privateKey, { algorithm: 'RS256', expiresIn: process.env.TKN_EXPIRATION })
    },
    public jwtLoginVerify = async (req: Request, jwtPayload: string, done: DoneType) => {
      try {
        const id = jwtPayload.sub as unknown as string
        const user = await this.prisma.users.gFindById(id)
        if ('username' in user && user.username !== undefined && user.username !== null) {
          this.tokenIssuance(id, req)
          done(null, user.data, { message: 'Successfully Logged In' })
        } else done(null, false, { message: 'ID doesnt match any registred users' })
      } catch (error) {
        logger.error({ function: 'AuthService.jwtLoginVerify', error })
        done(error, false, { message: 'Database Error' })
      }
    },
    public googleAuthVerify = (req: Request, accessToken: string, refreshToken: string, profile: any, done: DoneType) => {
      console.log(profile)
      try {
        const [email] = profile.emails.value
        this.prisma.users.findUnique({ where: { username: email } }).then(user => {
          if (user?.username != null) {
            this.tokenIssuance(user.id, req)
            return done(null, user, { message: 'Successfully Logged in!' })
          } else {
            req.flash('at', accessToken)
            req.flash('rt', refreshToken)
            return done(null, false, { message: 'username doesnt exist' })
          }
        }).catch(error => {
          logger.error({ function: 'AuthService.googleAuthVerify', error })
          done(error, false, { message: 'Database Error' })
        })
      } catch (error) {
        logger.error({ function: 'AuthService.googleAuthVerify', error })
        done(error, false, { message: 'Database Error' })
      }
    }
  ) { super() }
}
