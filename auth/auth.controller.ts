import { type NextFunction, type Request, type Response } from 'express'
import { AuthService } from './auth.service'
import { encrypt, decrypt } from '../Services/keypair.service'
import dotenv from 'dotenv'

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
          res.status(200).send({ ...req.user, token, hash: undefined, refreshToken: undefined, accessToken: undefined })
        } else res.status(401).send({ ok: false })
      } else res.status(401).send({ ok: false })
    },
    public localLogin = (req: Request, res: Response) => {
      if (req.isAuthenticated() && 'id' in req?.user && req.user.id !== null) {
        const token = this.service.tokenIssuance(req.user.id as string)
        res.status(200).send(JSON.stringify({ ...req.user, hash: null, token }))
      } else res.status(404).send({ ok: false, message: 'Invalid Credentials' })
    }
  ) {}
}
