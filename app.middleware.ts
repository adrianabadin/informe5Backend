/* eslint-disable @typescript-eslint/no-misused-promises */
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
import { engine } from 'express-handlebars'
export const app = express()
app.use(express.static('public'))

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
app.engine('handlebars', engine())
app.set('view engine', 'handlebars')
app.set('views', './views')

app.use(sessionMiddleware)
app.use(flash())
app.use(cookieParser("Whether 'tis nobler in the mind to suffer"))
app.use(passport.initialize())
app.use(passport.session())
routeHandler(app)
