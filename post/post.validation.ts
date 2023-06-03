import { type NextFunction, type Request, type Response } from 'express'
import { body, validationResult } from 'express-validator'
import { ResponseObject } from '../Entities'
export const postValidation = [
  body('title').isString().withMessage({ code: 1, error: 'El titulo debe ser un String' }).isLength({ min: 3 }).withMessage('Debe tener al menos 3 caracteres'),
  body('heading').isString().withMessage({ code: 2, error: 'El encabezado debe ser un String' }).isLength({ min: 3 }).withMessage('Debe tener al menos 3 caracteres'),
  body('text').isString().withMessage({ code: 3, error: 'El Texto debe ser un String' }).isLength({ min: 3 }).withMessage('Debe tener al menos 3 caracteres'),
  body('classification').isString().withMessage({ code: 4, error: 'La clasificacion debe ser un string' }).isLength({ min: 3 }).withMessage('La clasificacion debe tener al menos 3 caracteres'),
  body('importance').isString().withMessage('La clasificacion debe ser un string').isNumeric().withMessage('debe ser un numero'),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req)
    if (errors.isEmpty()) next()
    else {
      res.status(404).send(new ResponseObject(errors, false, null))
    }
  }
]
