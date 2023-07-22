import { type NextFunction, type Request, type Response } from 'express'
import { type AnyZodObject } from 'zod'
import { logger } from '../Services/logger.service'

export const schemaValidator = (schema: AnyZodObject) => (req: Request, _res: Response, next: NextFunction) => {
  try {
    schema.parse(req)
    next()
  } catch (error) {
    logger.error({ function: 'schemaValidator', error })
  }
}
