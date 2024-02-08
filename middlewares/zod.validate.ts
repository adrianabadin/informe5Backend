import { type NextFunction, type Request, type Response } from 'express'
import { ZodError, type AnyZodObject } from 'zod'
import { logger } from '../Services/logger.service'

export const schemaValidator = (schema: AnyZodObject | AnyZodObject[]) => (req: Request, res: Response, next: NextFunction) => {
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
      res.status(404).send({
        error:
        error.issues.map(issue => ({ path: issue.path, message: issue.message, code: issue.code }))
      })
      logger.error({ function: 'schemaValidator', error: error.issues.map(issue => ({ path: issue.path, message: issue.message, code: issue.code })) })
    }
  }
}
