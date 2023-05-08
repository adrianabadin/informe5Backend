import winston from 'winston'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
dotenv.config()
const logPath = process.env.LOG_DIRECTORY ?? ''

if (logPath !== undefined && !fs.existsSync(logPath)) fs.mkdirSync(logPath)
export const logger = winston.createLogger({
  level: 'debug',
  format: winston.format.combine(winston.format.prettyPrint(), winston.format.timestamp()),
  transports: [new winston.transports.File({
    filename: path.join(logPath, 'errors.log'),
    level: 'error'
  }),
  new winston.transports.File({ filename: path.join(logPath, 'debug.log') })]

})

if (process.env.NODE_ENV !== 'PRODUCTION') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.prettyPrint(),
      winston.format.colorize({ all: true }),
      winston.format.timestamp())
  }))
}
