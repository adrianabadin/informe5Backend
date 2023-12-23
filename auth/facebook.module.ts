import passport from 'passport'
import { AuthService } from './auth.service'
import { Strategy } from 'passport-facebook'
import { type Request } from 'express'
import { logger } from '../Services/logger.service'
import { body } from 'express-validator'
const authService = new AuthService()
passport.use('facebook', new Strategy({
  clientID: process.env.FACEBOOK_APP_ID as string,
  clientSecret: process.env.FACEBOOK_APP_SECRET as string,
  callbackURL: process.env.FACEBOOK_APP_CB as string,

  passReqToCallback: true,
  profileFields: ['id', 'displayName', 'emails', 'photos', 'birthday', 'gender', 'name', 'profileUrl']
}, (req: Request<any>, accessToken: string, refreshToken: string, profile: object, cb: (...args: any) => void) => {
  console.log(req.query)
  if ('id' in profile) authService.getLongliveAccessToken(accessToken, profile.id as string).then(response => { console.log(response?.body) }).catch((e: any) => { console.log(e) })
  const { birthDate, gender, phone } = JSON.parse(req.query.state as string)
  /**
 * logica a implementar
 * si el usuario de facebook ya esta registrado con su email, verifica si es administrador de la pagina, verifica si es administrador
 * en la base de datos, si no es admin de la db pero si de fb actualiza la base de datos. si no es admin de fb verifica que tenga rol
 * de usuarios y si no es asi actualiza su rol a usuarios, luego hace el login y devuelve la respuesta.
 * SI el usuario no esta registrado, y se recibieron query params, crea un nuevo usuario, si no se recibiero query params, se devuelve
 * el failed to login y se redirige a una vista que permita enviar la solicitud con esos params
 */
  if ('emails' in profile && Array.isArray(profile.emails)) {
    authService.findFBUserOrCreate(profile.emails[0].value as string, profile, accessToken, birthDate, phone, gender)
      .then(response => {
        console.log(response)
        if (response?.id != null) {
          cb(null, response)
        } else cb(new Error('Usuario inexistente, faltan datos para crearlo'), null)
      })
      .catch(error => logger.error({ function: 'FacebookStrategy', error }))
  }

//  authService.isFacebookAdmin(accessToken).then(response => { console.log({ response }) }).catch(e => { console.log(e) })
  // cb(null, { id: 'ada' })
}))
