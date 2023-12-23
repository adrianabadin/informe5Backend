import crypto from 'crypto'
import fs from 'fs'
export function genKeyPair (path: string): void {
  // Generates an object where the keys are stored in properties `privateKey` and `publicKey`
  const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 4096, // bits - standard for RSA keys
    publicKeyEncoding: {
      type: 'pkcs1', // "Public Key Cryptography Standards 1"
      format: 'pem' // Most common formatting choice
    },
    privateKeyEncoding: {
      type: 'pkcs1', // "Public Key Cryptography Standards 1"
      format: 'pem' // Most common formatting choice
    }
  })
  fs.writeFileSync(`../${path}/publicKey.pem`, publicKey)
  fs.writeFileSync(`../${path}/privateKey.pem`, privateKey)
}

export function simetricKeyCreate (path: string): void {
  const key = crypto.randomBytes(32)
  fs.writeFileSync(`../${path}/simetricKey.pem`, key.toString('base64'))
  console.log(key.toString('base64'))
}
export function encrypt (value: string, simetricKey: string): string {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(simetricKey, 'base64'), iv)
  cipher.setAutoPadding(true)
  let encriptedText = cipher.update(value, 'utf-8', 'hex')
  encriptedText += cipher.final('hex')
  console.log(iv)
  return iv.toString('hex') + 'bLoquE' + encriptedText
}
export function decrypt (value: string, simetricKey: string): string {
  const iv = Buffer.from(value.split('bLoquE')[0], 'hex')
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(simetricKey, 'base64'), iv)
  decipher.setAutoPadding(true)
  const encryptedText = value.split('bLoquE')[1]
  let decryptedToken = decipher.update(encryptedText, 'hex', 'utf8')
  decryptedToken += decipher.final('utf8')
  return decryptedToken
}
