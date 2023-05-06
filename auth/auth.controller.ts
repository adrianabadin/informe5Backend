import { type NextFunction, type Request, type Response } from 'express'

export class AuthController {
  constructor (
    public Guard = (req: Request, res: Response, next: NextFunction) => {
      let id
      if (req.user !== undefined && 'id' in req.user) {
        id = req.user.id
      } else return
      if (id !== undefined && id !== null) next()
    }
  ) {}
}
