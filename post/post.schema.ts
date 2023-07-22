import { z, ZodError } from 'zod'

export const body = z.object({
  id: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  title: z.string(),
  subTitle: z.string().nullable().optional(),
  heading: z.string(),
  text: z.string(),
  classification: z.string(),
  importance: z.number().optional(),
  fbid: z.string().nullable().optional(),
  images: z.array(z.object({
    id: z.string(),
    createdAt: z.date(),
    updatedAt: z.date(),
    url: z.string(),
    fbid: z.string()
  })),
  author: z.string()
})

export const query = z.object({
  cursor: z.string({ invalid_type_error: 'Must be a string' }).optional(),
  title: z.string({ invalid_type_error: 'Must be a string' }).optional(),
  search: z.string({ invalid_type_error: 'Must be a string' }).optional(),
  minDate: z.string({ invalid_type_error: 'Must be a string' }).optional(),
  maxDate: z.string({ invalid_type_error: 'Must be a string' }).optional(),
  category: z.string({ invalid_type_error: 'Must be a string' }).optional()
})

export const param = z.object({
  id: z.string().optional()
})
