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
import { userLogged } from '../app'
import { FacebookService } from '../Services/facebook.service'
dotenv.config()
const simetricKey = process.env.SIMETRICKEY
const privateKey = fs.readFileSync('auth/privateKey.pem', 'utf-8')
export class AuthService extends DatabaseHandler {
  constructor (
    protected crypt = { encrypt, decrypt },
    protected facebookService = new FacebookService(),
    public localSignUpVerify = async (req: Request, username: string, password: string, done: DoneType) => {
      try {
        let user: Prisma.UsersCreateInput | Prisma.UsersUncheckedCreateInput | null = await this.prisma.users.findUnique({ where: { username } })
        if (user === null) {
          const body: Prisma.UsersCreateInput | Prisma.UsersUncheckedCreateInput = { ...req.body, hash: await argon2.hash(password), id: undefined, avatar: req.file?.path }
          if ('password' in body) { delete body.password }
          logger.debug({
            function: 'AuthService.localSignUpVerify', user: { ...body, hash: null }
          })
          user = (await this.prisma.users.create({ data: { ...body, birthDate: new Date(body.birthDate as string) } }))
          console.log(user, body)
          if (user?.id !== undefined) {
            console.log('llego al final')
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
        const user: Prisma.UsersCreateInput | Prisma.UsersUncheckedCreateInput = await this.prisma.users.findUniqueOrThrow({ where: { username }, select: { isVerified: true, lastName: true, id: true, username: true, name: true, rol: true, hash: true } }) as any
        if (user !== undefined && 'username' in user && user.username !== null) {
          logger.debug({
            function: 'AuthService.localLoginVerify', user: { ...user, hash: null }
          })
          let isValid: boolean = false
          if ('hash' in user && user.hash !== null && user.hash !== undefined) { isValid = await argon2.verify(user.hash, password) }
          if (isValid) {
            if (user !== null && 'id' in user && user.id !== undefined) {
              console.log('some', user)
              delete user.hash
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
        const user = await this.prisma.users.gFindById(id, { isVerified: true, lastName: true, id: true, username: true, name: true, rol: true, accessToken: true })
        userLogged.accessToken = user.data.accessToken
        userLogged.id = user.data.id
        userLogged.isVerified = user.data.isVerified
        userLogged.lastName = user.data.lastName
        userLogged.name = user.data.name
        userLogged.rol = user.data.rol
        userLogged.username = user.data.username
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
        this.prisma.users.findUnique({ where: { username: email }, select: { isVerified: true, lastName: true, name: true, id: true, username: true, rol: true } }).then(user => {
          if (user?.username != null) {
            console.log(user, 'user')
            return done(null, user as any, { message: 'Successfully Logged in!' })
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
    },
    public isFacebookAdmin = async (token: string): Promise<boolean> => {
      let bool: boolean = false
      try {
        const resp = await fetch(`https://graph.facebook.com/me/accounts?access_token=${token}`)
        const response = await resp.json()
        if ('data' in response && Array.isArray(response.data)) {
          response.data.forEach((page: any) => {
            if ('id' in page && page.id === process.env.FACEBOOK_PAGE) bool = true
          })
        }
      } catch (error) {
        logger.error({ function: 'isFacebookAdmin.authService', error })
      }
      return bool
    },

    public findFBUserOrCreate = async (email: string, profile: any, accessToken: string, birthDay?: string, phone?: string, gender: Prisma.UsersCreateInput['gender']) => {
      const admin = await this.isFacebookAdmin(accessToken)
      let finalAccessToken: string | undefined = ''
      if (admin) finalAccessToken = await this.facebookService.getLongliveAccessToken(accessToken, profile.id)
      const user = await this.prisma.users.findUnique({ where: { username: email } })
      if (user != null) { // usuario existe
        if (user.rol !== 'ADMIN' && admin) { // el rol del usuario no es admin, pero administra la pagina
          const response = await this.prisma.users.update({ where: { username: email }, data: { rol: 'ADMIN', accessToken: finalAccessToken, isVerified: true, avatar: profile.photos[0].value, fbid: profile.id } })
          return response
        } else if (user.rol === 'ADMIN' && !admin) {
          const response = await this.prisma.users.update({ where: { username: email }, data: { rol: 'USER', isVerified: true, accessToken: finalAccessToken, avatar: profile.photos[0].value, fbid: profile.id } })
          return response
        } else if (user.accessToken === null || user.avatar === null || user.fbid === null || !user.isVerified) {
          const response = await this.prisma.users.update({ where: { username: email }, data: { accessToken: finalAccessToken, isVerified: true, avatar: profile.photos[0].value, fbid: profile.id } })
          return response
        }
        return user
      } else { // usuario no existe valida si es admin o user y si tiene la informacion lo crea
        if (gender !== null && phone !== undefined && birthDay !== null) {
          const response = await this.prisma.users
            .gCreate({
              lastName: profile.name.familName as string,
              name: profile.name.givenName as string,
              phone,
              username: email,
              rol: admin ? 'ADMIN' : 'USER',
              isVerified: true,
              accessToken,
              gender,
              birthDate: birthDay,
              fbid: profile.id,
              avatar: profile.photos[0].value

            })

          return response.data
        } // no se pasaron los datos opcionales ala funcion entonces devuelve un undefined y vuelve  a la strategy para continuar flujo
      }
    }
  ) { super() }
}
