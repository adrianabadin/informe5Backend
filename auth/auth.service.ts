import { DatabaseHandler } from '../Services/database.service'
import { logger } from '../Services/logger.service'
import { type Prisma, type Users } from '@prisma/client'
import { type Request } from 'express'
import argon2 from 'argon2'
import jwt from 'jsonwebtoken'
import fs from 'fs'
import dotenv from 'dotenv'
import { type IResponseObject, type DoneType } from '../Entities'
import { encrypt, decrypt } from '../Services/keypair.service'
dotenv.config()
const simetricKey = process.env.SIMETRICKEY
const privateKey = fs.readFileSync('auth/privateKey.pem', 'utf-8')
export class AuthService extends DatabaseHandler {
  constructor (
    protected crypt = { encrypt, decrypt },
    public localSignUpVerify = async (req: Request, username: string, password: string, done: DoneType) => {
      try {
        let user: Prisma.UsersCreateInput | Prisma.UsersUncheckedCreateInput | null = await this.prisma.users.findUnique({ where: { username } })
        if (user === null) {
          const body: Prisma.UsersCreateInput | Prisma.UsersUncheckedCreateInput = { ...req.body, hash: await argon2.hash(password) }
          if ('password' in body) { delete body.password }
          logger.debug({
            function: 'AuthService.localSignUpVerify', user: { ...body, hash: null }
          })
          user = (await this.prisma.users.gCreate({ ...body, birthDate: (body.birthDate !== undefined) ? new Date(body.birthDate as string) : undefined })).data
          if (user?.id !== undefined) {
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
          let isValid: boolean = false
          if ('hash' in user && user.hash !== null && user.hash !== undefined) { isValid = await argon2.verify(user.hash, password) }
          if (isValid) {
            if (user !== null && 'id' in user && user.id !== undefined) {
              done(null, user, { message: 'Successfully Logged In' })
            } else done(null, false, { message: 'Password doesent match' })
          } else done(null, false, { message: 'username doesnt exist' })
        }
      } catch (error) {
        logger.error({ function: 'AuthService.localLoginVerify', error })
        done(error, false, { message: 'Database Error' })
      }
    },
    public tokenIssuance = (id: string): string => {
      const jwToken = jwt.sign({ sub: id }, privateKey, { algorithm: 'RS256', expiresIn: process.env.TKN_EXPIRATION })
      if (simetricKey !== undefined) { return this.crypt.encrypt(jwToken, simetricKey) } else throw new Error('simetricKey is undefined')
    },
    public jwtLoginVerify = async (req: Request, jwtPayload: string, done: DoneType) => {
      try {
        const id = jwtPayload.sub as unknown as string
        const user = await this.prisma.users.gFindById(id)
        if ('username' in user?.data && user?.data.username !== undefined && user?.data.username !== null) {
          logger.debug({ function: 'jwtLoginVerify', message: 'Successfully logged in' })
          done(null, user.data, { message: 'Successfully Logged In' })
        } else {
          logger.debug({ function: 'jwtLoginVerify', message: 'ID doesent match any registred users' })
          done(null, false, { message: 'ID doesnt match any registred users' })
        }
      } catch (error) {
        logger.error({ function: 'AuthService.jwtLoginVerify', error })
        done(error, false, { message: 'Database Error' })
      }
    },
    public googleAuthVerify = (req: Request, accessToken: string, refreshToken: string, profile: any, done: DoneType) => {
      try {
        const { email } = profile
        this.prisma.users.findUnique({ where: { username: email } }).then(user => {
          if (user?.username != null) {
            console.log(user, 'user')
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
    },
    public serialize = (user: any, done: DoneType) => {
      done(null, user.id)
    },
    public deSerialize = (userId: string, done: DoneType) => {
      this.prisma.users.gFindById(userId)
        .then((response: IResponseObject) => {
          const data: Users = response.data
          return done(null, data)
        })
        .catch(error => {
          logger.error({ function: 'AuthService.deSerialize', error })
        })
    }
  ) { super() }
}
