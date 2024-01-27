import googleapis from 'googleapis'
const oauthClient = new googleapis.google.auth.OAuth2(
  process.env.CLIENTID_BUCKET,
  process.env.CLIENTSECRET_BUCKET,
  process.env.CALLBACK_BUCKET)
const scopes = ['https://www.googleapis.com/auth/drive', 'https://www.googleapis.com/auth/youtube']
export const url = oauthClient.generateAuthUrl({ access_type: 'offline', scope: scopes })
