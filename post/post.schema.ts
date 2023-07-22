import { z } from 'zod'

export const postCreateSchema = z.object({
  body: z.object({
    id: z.string().uuid(),
    createdAt: z.date(),
    updatedAt: z.date(),
    title: z.string().min(3),
    subTitle: z.string().nullable().optional(),
    heading: z.string().min(3),
    text: z.string().min(3),
    classification: z.string().min(3),
    importance: z.number().optional(),
    fbid: z.string().nullable().optional(),
    author: z.string()
  })
})

export const getPostsSchema = z.object({
  query: z.object({
    cursor: z.string({ invalid_type_error: 'Must be a string' }).min(3).optional(),
    title: z.string({ invalid_type_error: 'Must be a string' }).min(3).optional(),
    search: z.string({ invalid_type_error: 'Must be a string' }).min(3).optional(),
    minDate: z.string({ invalid_type_error: 'Must be a string' }).min(6).optional(),
    maxDate: z.string({ invalid_type_error: 'Must be a string' }).min(6).optional(),
    category: z.string({ invalid_type_error: 'Must be a string' }).min(6).optional()

  })
})

export const getPostById = z.object({
  params: z.object({ id: z.string().optional() })
})
