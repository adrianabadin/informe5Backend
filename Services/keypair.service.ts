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
