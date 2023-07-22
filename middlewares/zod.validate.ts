import { type NextFunction, type Request, type Response } from 'express'
import { ZodError, type AnyZodObject } from 'zod'
import { logger } from '../Services/logger.service'

export const schemaValidator = <T>(schema: AnyZodObject | AnyZodObject[]) => <T>(req: Request, res: Response, next: NextFunction) => {
  try {
    if (Array.isArray(schema)) {
      schema.forEach(singleSchema => {
        singleSchema.parse({
          body: req.body,
          query: req.query,
          params: req.params
        })
      })
    } else {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params
      })
    }
    next()
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(404).send({ error: { message: error.issues } })
      logger.error({ function: 'schemaValidator', error })
    }
  }
}
