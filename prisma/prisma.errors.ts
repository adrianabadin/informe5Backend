// import { UnknownPrismaError } from '../Services/prisma.errors'
// abstract class PrismaError extends Error {
//   public text: string
//   constructor (public errorContent: any, message: string = 'Generic Prisma Error', code: number = 1000) {
//     super(message)
//     this.name = 'Prisma Error'
//     this.text = this.message
//   }
// }
// export class NotFoundPrismaError extends PrismaError {
//   constructor (errorContent: any, message: string = 'Registro no encontrado', code: number = 1001) {
//     super(errorContent, message, code)
//   }
// }
