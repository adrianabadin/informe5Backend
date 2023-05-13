import { type NextFunction, type Request, type Response } from 'express'
import { body, validationResult } from 'express-validator'
export const loginValidator = [
  body('username').notEmpty().withMessage('Cant post an empty String').isEmail().withMessage('Doesnt match a email type'),
  body('password').notEmpty(), // .isStrongPassword({ minLowercase: 3, minUppercase: 3, minNumbers: 1, minSymbols: 1 }).withMessage('Password must be have at least 3 lowercase leters 3 Upercase 1 number and 1 symbol'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req)
    if (errors.isEmpty()) { next() } else {
      const data: any[] = errors.array()
      req.flash('errors', data)
      res.redirect('/auth/failedlogin')
    }
  }
]
