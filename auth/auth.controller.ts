import { type NextFunction, type Request, type Response } from 'express'
import { AuthService } from './auth.service'

export class AuthController {
  constructor (
    public service = new AuthService(),
    public Guard = (req: Request, res: Response, next: NextFunction) => {
      let id
      if (req.user !== undefined && 'id' in req.user) {
        id = req.user.id
      } else return
      if (id !== undefined && id !== null) next()
    },
    public issueJWT = (req: Request, res: Response, next: NextFunction) => {
      if (req.isAuthenticated()) {
        if ('id' in req?.user) {
          res.cookie('jwt', this.service.tokenIssuance(req.user.id as string), { secure: true, httpOnly: true, signed: true })
          next()
        }
      } res.status(401).send({ message: 'Not Authorized' })
    }
  ) {}
}
