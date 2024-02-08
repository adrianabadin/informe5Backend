export abstract class PrismaError extends Error {
  constructor (public errorContent?: any, public target?: any, message: string = 'Generic prisma error', public code: number = 3000) {
    super(message)
    this.name = 'Prisma Error'
    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    if (Error.captureStackTrace) Error.captureStackTrace(this, PrismaError)
  }
}
export class UniqueRestraintError extends PrismaError {
  constructor (public errorContent?: any, public target?: any, message: string = 'No se puede duplicar un campo unico', public code: number = 3001) {
    super(errorContent, target, message, code)
    this.name = 'Unique Restraint Error'
  }
}

export class ColumnPrismaError extends PrismaError {
  constructor (public errorContent?: any, public target?: any, message: string = 'El dato excede el tamaño de la columna', public code: number = 3002) {
    super(errorContent, target, message, code)
    this.name = 'Column Prisma Error'
  }
}
export class NotFoundPrismaError extends PrismaError {
  constructor (public errorContent?: any, public target?: any, message: string = 'El registro no se encontro', public code: number = 3003) {
    super(errorContent, target, message, code)
    this.name = 'Not Found Prisma Error'
  }
}
export class UnknownPrismaError extends PrismaError {
  constructor (public errorContent: any, public target?: any, message: string = 'Error desconocido en la base de datos', public code: number = 3000) {
    super(errorContent, target, message, code)
    this.name = 'Unknown Prisma Error'
  }
}
