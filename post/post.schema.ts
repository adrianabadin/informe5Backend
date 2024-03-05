import { z, ZodObject } from 'zod'
import { ClassificationArray } from '../Entities'
import { type Prisma } from '@prisma/client'

const videoSchema = z.object({
  id: z.string().uuid(),
  youtubeId: z.string().min(3, { message: 'YoutubeId debe ser un string de al menos 3 letras' }),
  url: z.string().optional()
})
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
    importance: z.enum(['1', '2', '3', '4', '5'], { invalid_type_error: 'La importancia de la nota debe ser string de  un numero del 1 al 5' }),
    fbid: z.string({ invalid_type_error: 'Facebook ID debe ser una cadena' }).nullable().optional(),
    author: z.string({ invalid_type_error: 'El autor debe ser una cadena que represente el id del usuario', required_error: 'Debes proveer un autor' }).uuid({ message: 'El autor debe ser un UUID' }),
    video: z.string().optional()
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
  body: z.object({
    title: z.string({ invalid_type_error: 'El titulo debe ser una cadena' }).min(3, 'El titulo debe tener al menos 3 caracteres de longitud'),
    subTitle: z.string({ invalid_type_error: 'El subtitulo debe ser una cadena' }).min(3, 'El subtitulo debe tener al menos 3 caracteres de longitud').optional(),
    heading: z.string({ invalid_type_error: 'El encabezado de la nota debe ser una cadena' }).min(3, 'El encabezado de la nota debe tener al menos 3 caracteres de longitud'),
    text: z.string({ invalid_type_error: 'El texto de la nota debe ser una cadena' }).min(3, 'El texto de la nota debe tener al menos 3 caracteres de longitud'),
    classification: z.enum(ClassificationArray, { invalid_type_error: `La categoria debe pertenecer a ${ClassificationArray.join(',')}` }),
    importance: z.enum(['1', '2', '3', '4', '5'], { invalid_type_error: 'La importancia de la nota debe ser string de  un numero del 1 al 5' }),
    author: z.string({ invalid_type_error: 'El autor debe ser un string' }).uuid({ message: 'El autor debe ser una cadena que represente a un uuid' }),
    audio: z.string().optional(),
    video: z.string().optional()
  })
})
export const getPostById = z.object({
  params: z.object({ id: z.string({ invalid_type_error: 'El ID debe ser una cadena' }).uuid({ message: 'La cadena debe ser un UUID' }) })
})

const imageSchema = z.object({
  id: z.string({ invalid_type_error: 'Images ID debe ser un string' }).uuid({ message: 'Images ID debe ser una cadena que represente a un uuid' }).optional(),
  fbid: z.string({ invalid_type_error: 'Images FBID debe ser un string' }).uuid({ message: 'Images FBID debe ser una cadena que represente a un uuid' }),
  url: z.string({ invalid_type_error: 'Images URL must be a string' }).url({ message: 'The string provided must be a URL' })
})
const stringifiedImage = z.custom < string >((data) => {
  try {
    const dataParsed = JSON.parse(data as string)
    imageSchema.parse(dataParsed)
    return true
  } catch (e) { return false }
})
export const updatePostSchema = z.object({
  body: z.object({
    title: z.string({ invalid_type_error: 'El titulo debe ser una cadena' }).min(3, 'El titulo debe tener al menos 3 caracteres de longitud').optional(),
    subTitle: z.string({ invalid_type_error: 'El subtitulo debe ser una cadena' }).min(3, 'El subtitulo debe tener al menos 3 caracteres de longitud').optional(),
    heading: z.string({ invalid_type_error: 'El encabezado de la nota debe ser una cadena' }).min(3, 'El encabezado de la nota debe tener al menos 3 caracteres de longitud').optional(),
    text: z.string({ invalid_type_error: 'El texto de la nota debe ser una cadena' }).min(3, 'El texto de la nota debe tener al menos 3 caracteres de longitud').optional(),
    classification: z.enum(ClassificationArray, { invalid_type_error: `La categoria debe pertenecer a ${ClassificationArray.join(',')}` }).optional(),
    importance: z.enum(['1', '2', '3', '4', '5'], { invalid_type_error: 'La importancia de la nota debe ser string de  un numero del 1 al 5' }).optional(),
    author: z.string({ invalid_type_error: 'El autor debe ser un string' }).uuid({ message: 'El autor debe ser una cadena que represente a un uuid' }).optional(),
    fbid: z.string({ invalid_type_error: 'Post FBID must be a string' }),
    dbImages: z.array(stringifiedImage).optional(),
    audio: z.string().optional(),
    video: z.string().optional()

  })

})

export const videoUploadSchema = z.object({
  body: z.object({
    url: z.string().url({ message: 'Debe contener una url valida' }).optional(),
    title: z.string().min(3, { message: 'El titulo debe tener al menos 3 letras' }).optional(),
    description: z.string().min(3, { message: 'La descripcion debe tener al menos 3 letas' }).optional(),
    tags: z.array(z.string()).optional()

  }).refine((value) => {
    if (value.url !== undefined) return true
    else if (value.title !== undefined && value.description !== undefined) return true
    return false
  })
})
export const videoEraseSchema = z.object({
  query: z.object({
    youtubeId: z.string().min(3, { message: 'El youtube ID debe tener al menos 3 letras' })
  })
})

const audioSchema = z.object({
  id: z.string().uuid({ message: 'Debe ser un uuid de la base de datos' }),
  driveId: z.string().uuid({ message: 'Debe ser un UUID de google' })
})
const postManResponse = z.object({
  id: z.string().uuid(),
  createdAt: z.date({ invalid_type_error: 'Debe ser una fecha valida' }),
  title: z.string().min(3, { message: 'El titulo debe tener al menos 3 letras' }),
  heading: z.string().min(3, { message: 'El encabezado debe tener al menos 3 letras' }),
  text: z.string().min(3, { message: 'El texto debe tener al menos 3 letras' }),
  classification: z.string().min(3, { message: 'La clasificacion debe tener al menos 3 letras' }),
  importance: z.number(),
  fbid: z.string().min(3, { message: 'El fbid debe tener al menos 3 letras' }),
  isVisible: z.boolean(),
  images: z.array(imageSchema, { invalid_type_error: 'Debe ser un array de imagenes' }),
  audio: z.array(audioSchema, { invalid_type_error: 'Debe ser un array de audioSchema' }),
  video: z.array(videoSchema, { invalid_type_error: 'Debe ser un array de videoSchema' }),
  avatar: z.string().url({ message: 'El avatar debe ser un link a la imagen de avatar' }),
  birthDate: z.date(),
  lastName: z.string().min(3, { message: 'El apellido debe ser una cadena de al menos 3 letras' }),
  name: z.string().min(3, { message: 'El nombre debe ser una cadena de al menos 3 letras' }),
  isVerified: z.boolean()

})

/*
Inferencia de tipos
*/
export type CreatePostType = z.infer<typeof createPostSchema>
export type GetPostsType = z.infer<typeof getPostsSchema>
export type GetPostById = z.infer<typeof getPostById>
export type UpdatePostType = z.infer<typeof updatePostSchema>
export type ImagesSchema = z.infer<typeof imageSchema>
export type VideoUpload = z.infer<typeof videoUploadSchema>
export type VideoEraseType = z.infer<typeof videoEraseSchema>
export type PostManagerType = z.infer<typeof postManResponse>
