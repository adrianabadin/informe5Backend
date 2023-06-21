import { PrismaClient, type Prisma } from '@prisma/client'
import { logger } from './logger.service'
import { type IResponseObject, ResponseObject } from '../Entities'
export abstract class DatabaseHandler {
  static Instance: any
  constructor (
    protected unExtendedPrisma = new PrismaClient(),

    protected prisma = unExtendedPrisma.$extends({
      // result: {
      //   users: {
      //     toggleVerify: {
      //       needs: { id: true, isVerified: true },
      //       compute (user) {
      //         return () => unExtendedPrisma.users.update({ where: { id: user.id }, data: { isVerified: !user.isVerified } })
      //       }
      //     }
      //   }

      // },
      model: {

        $allModels:
        {
          async gCreate <T>(
            this: T & { create: any },
            args: Prisma.Args<T, 'create'>['data']
          ): Promise<ResponseObject> {
            try {
              const data = await this.create({ data: args })
              logger.debug({
                function: 'DatabaseHandler.create', data
              })
              return new ResponseObject(null, true, data)
            } catch (error) {
              logger.error({ function: 'DatabaseHandler.create', error })
              return new ResponseObject(error, false, null)
            }
          },
          async gUpdate<T>(this: T & { update: any }, dataObject: Prisma.Args<T, 'update'>['data'], id: string): Promise<IResponseObject> {
            try {
              const data = await this.update({ where: { id }, data: dataObject })
              logger.debug({
                function: 'DatabaseHandler.update', data
              })
              return new ResponseObject(null, true, data)
            } catch (error) {
              logger.error({
                function: 'DatabaseHandler.update', error
              })
              return new ResponseObject(error, false, null)
            }
          },
          async gFindById<T>(this: T & { findUniqueOrThrow: any }, id: string, includeField?: Prisma.Args<T, 'findUniqueOrThrow'>['include']): Promise<IResponseObject> {
            try {
              let data
              if (includeField !== undefined) {
                data = await this.findUniqueOrThrow({ where: { id }, include: includeField })
              } else {
                data = await this.findUniqueOrThrow({ where: { id } })
              }
              return new ResponseObject(null, true, data)
            } catch (error) {
              logger.error({
                function: 'DatabaseHandler.FindById', error
              })
              return new ResponseObject(error, false, null)
            }
          },
          async gGetAll<T>(this: T & { findMany: any }) {
            try {
              const data = await this.findMany({})
              return new ResponseObject(null, true, data)
            } catch (error) {
              logger.error({
                function: 'DatabaseHandler.GetAll', error
              })
              return new ResponseObject(error, false, null)
            }
          },
          async gGetN<T>(this: T & { findMany: any }, number: number, lastId?: string) {
            try {
              let data
              if (lastId !== undefined) {
                data = await this.findMany({
                  skip: 1,
                  take: number,
                  cursor: { id: lastId },
                  orderBy: { id: 'asc' }
                })
              } else {
                data = await this.findMany({ skip: 1, take: number, orderBy: { id: 'asc' } })
              }
              return new ResponseObject(null, true, data)
            } catch (error) {
              logger.error({
                function: 'DatabaseHandler.GetN', error
              })
              return new ResponseObject(error, false, null)
            }
          },
          async gDelete<T>(this: T & { delete: any }, id: string) {
            try {
              const data = await this.delete({ where: { id } })
              return new ResponseObject(null, true, data)
            } catch (error) {
              logger.error({
                function: 'DatabaseHandler.Delete', error
              })
              return new ResponseObject(error, false, null)
            }
          }

        }

      }

    }
    )
  ) {
    if (DatabaseHandler.Instance !== undefined) return DatabaseHandler.Instance
    DatabaseHandler.Instance = this
    return DatabaseHandler.Instance
  }
}

// users: {
//   async toggleVerify (id: string) {
// try {
//   const user = await prisma.users.findUniqueOrThrow({ where: { id } })
//   const data = await prisma.users.update({ where: { id }, data: { isVerified: !user.isVerified } })
//   logger.debug({
//     function: 'DatabaseHandler.toggleVerify', data
//   })
//   return new ResponseObject(null, true, data)
// } catch (error) {
//   logger.error({
//     function: 'DatabaseHandler.toggleVerify', error
//   })
// }
// }
// }

// protected usersExtended = unExtendedPrisma.$extends({
//   result: {
//     users: {
//       toggleVerify: {
//         needs: { id: true, isVerified: true },
//         async compute (user) {
//           const userDb = await unExtendedPrisma.users.findUniqueOrThrow({ where: { id: user.id } })
//           return await unExtendedPrisma.users.update({ where: { id: user.id }, data: { isVerified: !userDb.isVerified } })
//         }
//       }
//     }

//   }

// }),
