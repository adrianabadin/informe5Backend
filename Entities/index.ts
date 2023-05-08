import { type Prisma } from '@prisma/client'

export * from './response'

export type DoneType = (
  error: any,
  user: Prisma.UsersCreateInput | Prisma.UsersUncheckedCreateInput | false,
  message?: { message: string }
) => any
