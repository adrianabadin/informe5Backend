import { z } from 'zod'
import { ClassificationArray } from '../Entities'
import { type Prisma } from '@prisma/client'

export const postCreateSchema = z.object({
  body: z.object({
    id: z.string().uuid(),
    createdAt: z.date(),
    updatedAt: z.date(),
    title: z.string({ invalid_type_error: 'El titulo debe se una cadena', required_error: 'Debes proveer un titulo' }).min(3, 'La cadena debe contener al menos 3 caracteres'),
    subTitle: z.string({ invalid_type_error: 'El subtitulo debe ser un string' }).nullable().optional(),
    heading: z.string({ invalid_type_error: 'El encabezado debe se una cadena', required_error: 'Debes proveer un encabezado' }).min(3, 'La cadena debe contener al menos 3 caracteres'),
    text: z.string({ invalid_type_error: 'El cuerpo debe se una cadena', required_error: 'Debes proveer un texto para la nota' }).min(3, 'La cadena debe contener al menos 3 caracteres'),
    classification: z.enum(ClassificationArray, { invalid_type_error: `La clasificacion debe estar dentro de las siguientes opciones  ${ClassificationArray.join(',')}. `, required_error: 'Debes proveer una clasificacion' }),
    importance: z.number({ invalid_type_error: 'La importancia debe ser un numero' }).optional(),
    fbid: z.string({ invalid_type_error: 'Facebook ID debe ser una cadena' }).nullable().optional(),
    author: z.string({ invalid_type_error: 'El autor debe ser una cadena que represente el id del usuario', required_error: 'Debes proveer un autor' }).uuid({ message: 'El autor debe ser un UUID' })
  })
})
export const getPostsSchema = z.object({
  query: z.object({
    cursor: z.string({ invalid_type_error: 'El cursor debe ser una cadena que represente un Timestamp()' }).min(3).optional(),
    title: z.string({ invalid_type_error: 'El titulo debe ser una cadena' }).min(3, 'El titulo debe tener al menos 3 caracteres de longitud').optional(),
    search: z.string({ invalid_type_error: 'El search string debe ser una cadena' }).min(3, 'El search field debe tener 3 caracteres de longitud').optional(),
    minDate: z.string({ invalid_type_error: 'minDate debe ser una cadena' }).min(6, 'minDate debe tener al menos 6 caracteres de longitud').optional(),
    maxDate: z.string({ invalid_type_error: 'maxDate debe ser una cadena' }).min(6, 'maxDate debe tener al menos 6 caracteres de longitud').optional(),
    category: z.enum(ClassificationArray, { invalid_type_error: `La categoria debe pertenecer a ${ClassificationArray.join(',')}` }).optional()

  })
})
export const createPostSchema = z.object({
  title: z.string({ invalid_type_error: 'El titulo debe ser una cadena' }).min(3, 'El titulo debe tener al menos 3 caracteres de longitud'),
  subTitle: z.string({ invalid_type_error: 'El subtitulo debe ser una cadena' }).min(3, 'El subtitulo debe tener al menos 3 caracteres de longitud').optional(),
  heading: z.string({ invalid_type_error: 'El encabezado de la nota debe ser una cadena' }).min(3, 'El encabezado de la nota debe tener al menos 3 caracteres de longitud'),
  text: z.string({ invalid_type_error: 'El texto de la nota debe ser una cadena' }).min(3, 'El texto de la nota debe tener al menos 3 caracteres de longitud'),
  classification: z.enum(ClassificationArray, { invalid_type_error: `La categoria debe pertenecer a ${ClassificationArray.join(',')}` }),
  importance: z.number({ invalid_type_error: 'La importancia de la nota debe ser un numero' }).optional(),
  author: z.string({ invalid_type_error: 'El autor debe ser un string' }).uuid({ message: 'El autor debe ser una cadena que represente a un uuid' })
})
export const getPostById = z.object({
  params: z.object({ id: z.string({ invalid_type_error: 'El ID debe ser una cadena' }).uuid({ message: 'La cadena debe ser un UUID' }) })
})
export const updatePostSchema = z.object({
  title: z.string({ invalid_type_error: 'El titulo debe ser una cadena' }).min(3, 'El titulo debe tener al menos 3 caracteres de longitud').optional(),
  subTitle: z.string({ invalid_type_error: 'El subtitulo debe ser una cadena' }).min(3, 'El subtitulo debe tener al menos 3 caracteres de longitud').optional(),
  heading: z.string({ invalid_type_error: 'El encabezado de la nota debe ser una cadena' }).min(3, 'El encabezado de la nota debe tener al menos 3 caracteres de longitud').optional(),
  text: z.string({ invalid_type_error: 'El texto de la nota debe ser una cadena' }).min(3, 'El texto de la nota debe tener al menos 3 caracteres de longitud').optional(),
  classification: z.enum(ClassificationArray, { invalid_type_error: `La categoria debe pertenecer a ${ClassificationArray.join(',')}` }).optional(),
  importance: z.number({ invalid_type_error: 'La importancia de la nota debe ser un numero' }).optional(),
  author: z.string({ invalid_type_error: 'El autor debe ser un string' }).uuid({ message: 'El autor debe ser una cadena que represente a un uuid' }).optional(),
  images: z.string({ invalid_type_error: 'Images debe ser un string' }).uuid({ message: 'Images debe ser una cadena que represente a un uuid' }).optional()
})

/*
Inferencia de tipos
*/
export type CreatePostType = z.infer<typeof createPostSchema>
export type GetPostsType = z.infer<typeof getPostsSchema>
export type GetPostById = z.infer<typeof getPostById>
export type UpdatePostType = z.infer<typeof updatePostSchema>
