import { PrismaClient, type Prisma } from '@prisma/client'
import { logger } from './logger.service'
import { type IResponseObject, ResponseObject, type GenericResponseObject } from '../Entities'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client/.'
import dotenv from 'dotenv'
dotenv.config()
const client = createClient({ url: `${process.env.TURSO_DATABASE_URL}`, authToken: `${process.env.TURSO_AUTH_TOKEN}` })
const adapter = new PrismaLibSQL(client)
export class DatabaseHandler {
  static Instance: any
  constructor (
    public unExtendedPrisma = new PrismaClient({ adapter }),

    public prisma = unExtendedPrisma.$extends({

      model: {

        $allModels:
        {
          async  gCreate <T, A>(
            this: T & { create: any },
            args: Prisma.Exact<A, Prisma.Args<T, 'create'>['data'] & Prisma.Args<T, 'create'>['data']['images']['create']['include']>
          ): Promise<GenericResponseObject<Prisma.Result<T, A, 'create'>>> {
            try {
              const data = await this.create({ data: args, select: { author: { select: { name: true, lastName: true } }, id: true, createdAt: true, title: true, heading: true, text: true, classification: true, usersId: true, importance: true, isVisible: true, images: true } })
              logger.debug({
                function: 'DatabaseHandler.create', data
              })
              return new ResponseObject(null, true, data)
            } catch (error) {
              logger.error({ function: 'DatabaseHandler.create', error })
              return new ResponseObject(error, false, null)
            }
          },
          async gUpdate<T, A>(this: T & { update: any }, dataObject: Prisma.Exact<A, Partial<Prisma.Args<T, 'update'>['data']> >, id: string): Promise<GenericResponseObject<Prisma.Result<T, A, 'update'>>> {
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
          async gFindById<T, A>(this: T & { findUniqueOrThrow: any }, id: string, includeField?: Prisma.Exact<A, Prisma.Args<T, 'findUniqueOrThrow'>['select']>): Promise<GenericResponseObject<Prisma.Result<T, A, 'findUniqueOrThrow'>>> {
            try {
              let data
              if (includeField !== undefined) {
                data = await this.findUniqueOrThrow({ where: { id }, select: includeField })
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
          async gGetAll<T, A>(
            this: T & { findMany: any },
            includeFields: Prisma.Exact<A, Prisma.Args<T, 'findMany'>['include']>,
            paginationObject?: { cusor?: any, pagination: number },
            filter?: Prisma.Exact<A, Prisma.Args<T, 'findMany'>['where']>
          ): Promise<GenericResponseObject<Prisma.Result<T, A, 'findMany'>>> {
            try {
              if (paginationObject !== undefined) {
                if (paginationObject?.cusor !== undefined) {
                  // cursor and pagination provided second page and so on
                  const data = await this.findMany(
                    {
                      take: paginationObject.pagination,
                      skip: 1,
                      cursor: paginationObject.cusor,
                      include: includeFields,
                      orderBy: { createdAt: 'desc' },
                      where: filter === undefined ? undefined : filter
                    }
                  )
                  return new ResponseObject(null, true, data)
                } else {
                  // first page case paginationObject not undefined cursor not privided
                  const data = await this.findMany(
                    {
                      take: paginationObject.pagination,
                      include: includeFields,
                      orderBy: { createdAt: 'desc' },
                      where: filter === undefined ? undefined : filter
                    }
                  )
                  return new ResponseObject(null, true, data)
                }
              } else {
                // no pagination object defined request the entire collection
                const data = await this.findMany(
                  {
                    include: includeFields,
                    orderBy: { createdAt: 'desc' },
                    where: filter === undefined ? undefined : filter
                  }
                )
                return new ResponseObject(null, true, data)
              }
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
          async gDelete<T, A>(this: T & { delete: any }, id: Prisma.Exact<A, Prisma.Args<T, 'delete'>['where']['id']>): Promise<GenericResponseObject<Prisma.Result<T, A, 'delete'>>> {
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

export const prismaClient = new DatabaseHandler()
