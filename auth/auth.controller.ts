import { type NextFunction, type Request, type Response } from 'express'
import { AuthService } from './auth.service'
import { encrypt, decrypt } from '../Services/keypair.service'
import dotenv from 'dotenv'
import { userLogged } from '../app'
import * as jwt from 'jsonwebtoken'
import fs from 'fs'
import { PrismaClient } from '@prisma/client'
import { FacebookService } from '../Services/facebook.service'
dotenv.config()
const simetricKey = (process.env.SIMETRICKEY !== undefined) ? process.env.SIMETRICKEY : ''

export class AuthController {
  constructor (
    public service = new AuthService(),
    public cryptService = { encrypt, decrypt },
    public Guard = (req: Request, res: Response, next: NextFunction) => {
      let id
      if (req.user !== undefined && 'id' in req.user) {
        id = req.user.id
      } else return
      if (id !== undefined && id !== null) {
        const jwt = this.service.tokenIssuance(id as string)
        res.clearCookie('jwt')
        res.cookie('jwt', jwt)
        next()
      }
    },
    public jwtRenewalToken = (req: Request, res: Response, next: NextFunction) => {
      if (req.isAuthenticated()) {
        if ('id' in req.user) {
          const token = this.service.tokenIssuance(req.user.id as string)
          res.clearCookie('jwt')
          res.cookie('jwt', token)
          next()
        }
      }
    },
    public sendAuthData = (req: Request, res: Response) => {
      if (req.isAuthenticated()) {
        console.log(req.user)
        res.status(200).json(req.user)
      } else res.status(403).send('unauthorized')
    },
    public issueJWT = (req: Request, res: Response, next: NextFunction) => {
      console.log('issuing')
      if (req.isAuthenticated()) {
        console.log('authenticated')
        if ('id' in req?.user) {
          const jwt = this.service.tokenIssuance(req.user.id as string)
          const encriptedToken = this.cryptService.encrypt(jwt, simetricKey)

          res.status(200).send(encriptedToken)
        }
      }
      console.log('finished')
      next()
    },
    public jwtLogin = (req: Request, res: Response, next: NextFunction) => {
      if (req.isAuthenticated()) {
        console.log('is Auth')
        if ('id' in req?.user) {
          const token = this.service.tokenIssuance(req.user.id as string)
          res.clearCookie('jwt')
          res.status(200).send({ ...req.user, token, hash: undefined, refreshToken: undefined, accessToken: undefined })
        } else res.status(401).send({ ok: false })
      } else res.status(401).send({ ok: false })
    },
    public localLogin = (req: Request, res: Response) => {
      console.log(req.user, 'Login')
      if (req.isAuthenticated() && 'id' in req?.user && req.user.id !== null && typeof req.user.id === 'string') {
        const token = this.service.tokenIssuance(req.user.id)
        res.status(200).send({ ...req.user, password: null, token })
      } else res.status(404).send({ ok: false, message: 'Invalid Credentials' })
    },
    public facebookLogin = (req: Request, res: Response) => {
      if (req.isAuthenticated() && 'id' in req?.user && req.user.id !== null && typeof req.user.id === 'string') {
        const token = this.service.tokenIssuance(req.user.id)
        res.clearCookie('jwt')
        res.cookie('jwt', token)
        console.log(JSON.parse(req.query.state as string).cbURL as string)
        res.redirect(JSON.parse(req.query.state as string).cbURL as string)
      } else res.status(404).send({ ok: false, message: 'Invalid Credentials', code: '404' })
    },
    public gOAuthLogin = (req: Request, res: Response) => {
      if (req.isAuthenticated() && 'id' in req?.user && req.user.id !== null && typeof req.user.id === 'string') {
        const token = this.service.tokenIssuance(req.user.id)
        res.clearCookie('jwt')
        res.cookie('jwt', token)
        res.redirect('http://localhost:3000')
        // res.status(200).send({ message: 'Authenticated', token })
      } else res.status(401).send({ message: 'unAuthorized' })
    },
    public authState = async (req: Request, _res: Response, next: NextFunction) => {
      if (userLogged.id === '' && req.cookies.jwt !== null) {
        let tempJwt = req.cookies.jwt
        tempJwt = tempJwt !== undefined ? tempJwt : req.body.jwt !== undefined ? req.body.jwt : undefined
        if (tempJwt !== undefined) {
          const simetricKey = process.env.SIMETRICKEY
          const publicKey = fs.readFileSync(`${process.env.KEYS_PATH}/publicKey.pem`, 'utf-8')
          const jwtoken = decrypt(req.cookies.jwt, simetricKey)
          const token = jwt.verify(jwtoken, publicKey)
          const prisma = new PrismaClient()
          if (token !== undefined) {
            const user = await prisma.users.findUnique({ where: { id: token.sub as string }, select: { fbid: true, username: true, accessToken: true, id: true, isVerified: true, rol: true, lastName: true, name: true } })
            if (user !== null) {
              const facebookService = new FacebookService()
              if (user.accessToken !== null) { userLogged.accessToken = await facebookService.assertValidToken(user.accessToken) }
              userLogged.id = user.id
              userLogged.isVerified = user.isVerified
              userLogged.lastName = user.lastName
              userLogged.name = user.name
              userLogged.rol = user.rol
              userLogged.username = user.username
              if (user.fbid !== null) userLogged.fbid = user.fbid
              req.user = userLogged
            }
          }
        }
        req.user = userLogged
      }
      next()
    }
  ) {}
}
