import express from 'express'
import cookieParser from 'cookie-parser'
import passport from 'passport'
import './auth/localStrategy.module'
import './auth/googleOauth2.module'
import './auth/jwtStrategy.module'
import { PrismaSessionStore } from '@quixo3/prisma-session-store'
import { PrismaClient } from '@prisma/client'
import Session from 'express-session'
import flash from 'connect-flash'
import { routeHandler } from './app.routes'
export const app = express()
const store = new PrismaSessionStore(new PrismaClient(), {
  checkPeriod: 2 * 60 * 1000, // ms
  dbRecordIdIsSessionId: true,
  dbRecordIdFunction: undefined,
  ttl: 60 * 60 * 1000 * 24
})
const sessionMiddleware = Session({
  store,
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 60 * 60 * 1000 * 24 },
  secret: 'Dilated flakes of fire fall, like snow in the Alps when there is no wind'
})

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(sessionMiddleware)
app.use(flash())
app.use(cookieParser())
app.use(passport.initialize())
app.use(passport.session())
routeHandler(app)
