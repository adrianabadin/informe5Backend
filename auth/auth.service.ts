import { DatabaseHandler } from '../Services/database.service'
import { logger } from '../Services/logger.service'
import { type Prisma } from '@prisma/client'
import { type Request } from 'express'
import argon2 from 'argon2'
import jwt from 'jsonwebtoken'
import fs from 'fs'
import dotenv from 'dotenv'
dotenv.config()
const privateKey = fs.readFileSync('./privateKey.pem', 'utf-8')
export class AuthService extends DatabaseHandler {
  constructor (
    public localSignUpVerify = async (req: Request, username: string, password: string, done: (error: any, user: any) => any) => {
      try {
        let user: Prisma.UsersCreateInput | Prisma.UsersUncheckedCreateInput | null = await this.prisma.users.findUnique({ where: { username } })
        if (user === null) {
          const body: Prisma.UsersCreateInput | Prisma.UsersUncheckedCreateInput = { ...req.body, hash: await argon2.hash(password) }
          delete body.password
          logger.debug({
            function: 'AuthService.localSignUpVerify', user: { ...body, hash: null }
          })
          user = (await this.prisma.users.gCreate({ ...body })).data
          if (user?.id !== undefined) {
            this.tokenIssuance(user.id, req)
            done(null, user)
          } else done(null, false)
        } else done(null, false)
      } catch (error) {
        logger.error({
          function: 'AuthService.localSignUpVerify', error
        })
        done(error, false)
      }
    },
    public localLoginVerify = async (req: Request, username: string, password: string, done: (error: any, user: any) => any) => {
      try {
        const user: Prisma.UsersCreateInput | Prisma.UsersUncheckedCreateInput = await this.prisma.users.findUniqueOrThrow({ where: { username } })
        if (user !== undefined && 'username' in user && user.username !== null) {
          logger.debug({
            function: 'AuthService.localLoginVerify', user: { ...user, hash: null }
          })
          if (await argon2.verify(user.hash, password)) {
            if (user !== null && 'id' in user && user.id !== undefined) {
              this.tokenIssuance(user.id, req)
              done(null, user)
            } else done(null, false)
          } else done(null, false)
        }
      } catch (error) {
        logger.error({ function: 'AuthService.localLoginVerify', error })
        done(error, false)
      }
    },
    public tokenIssuance = (id: string, req: Request) => {
      req.cookies('jwt', jwt.sign({ sub: id }, privateKey, { algorithm: 'RS256', expiresIn: process.env.TKN_EXPIRATION }))
    },
    public jwtLoginVerify = async (req: Request, jwtPayload: string, done: (error: any, user: any) => any) => {
      try {
        const id = jwtPayload.sub as unknown as string
        const user = await this.prisma.users.gFindById(id)
        if ('username' in user && user.username !== undefined && user.username !== null) {
          this.tokenIssuance(id, req)
          done(null, user)
        } else done(null, false)
      } catch (error) {
        logger.error({ function: 'AuthService.jwtLoginVerify', error })
        done(error, false)
      }
    },
    public googleAuthVerify = (req: Request, accessToken: string, refreshToken: string, profile: any, done: (error: any, user: any) => any) => {
      try {
        const [email] = profile.emails.value
        this.prisma.users.findUnique({ where: { username: email } }).then(user => {
          if (user?.username != null) {
            this.tokenIssuance(user.id, req)
            done(null, user)
          }
        }).catch(error => {
          logger.error({ function: 'AuthService.googleAuthVerify', error })
          done(error, false)
        })
      } catch (error) {
        logger.error({ function: 'AuthService.googleAuthVerify', error })
        done(error, false)
      }
    }
  ) { super() }
}
