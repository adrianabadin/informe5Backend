import express from 'express'
import { logger } from './Services/logger.service'
import './app.middleware'
export const app = express()
const PORT = process.env.PORT !== undefined ? process.env.PORT : 8080

export const server = app.listen(PORT, () => {
  logger.info(`Listening on ${PORT}`)
})
