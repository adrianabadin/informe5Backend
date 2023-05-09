import { type NextFunction, type Request, type Response } from 'express'
import { body, validationResult } from 'express-validator'
export const signupValidator = [
  body('username').notEmpty().withMessage('Cant post an empty String').isEmail().withMessage('Doesnt match a email type'),
  body('password').isStrongPassword({ minLowercase: 3, minUppercase: 3, minNumbers: 1, minSymbols: 1 }).withMessage('Password must be have at least 3 lowercase leters 3 Upercase 1 number and 1 symbol'),
  body('name').isString().isLength({ min: 3 }),
  body('lastName').isString().isLength({ min: 3 }),
  body('phone').isMobilePhone('any', { strictMode: false }),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req)
    if (errors.isEmpty()) { next() } else {
      const data: any[] = errors.array()
      req.flash('errors', data)
      res.redirect('/auth/failedlogin')
    }
  }
]
