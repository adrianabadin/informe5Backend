
import { type Prisma } from '@prisma/client'
export * from '../Services/google.errors'
export type DoneType = (
  error: any,
  user: Prisma.UsersCreateInput | Prisma.UsersUncheckedCreateInput | false,
  message?: { message: string }
) => any
export type MyCursor = {
  [K in keyof Prisma.PostsCreateInput]: any
}
export interface IFacebookData { title: string, heading: string, text: string, classification: string }
export const ClassificationArray = ['Municipales', 'Economia', 'Politica'] as const
export class FacebookData implements IFacebookData {
  constructor (
    public classification: string,
    public heading: string,
    public text: string,
    public title: string) {}
}
