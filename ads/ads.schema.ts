import { z } from 'zod'
export const createAdSchema = z.object({
  body: z.object({
    importance: z.number().min(1, { message: 'El numero no puede ser menor a 1' }).max(4, { message: 'El numero no puede ser mayor a 4' }),
    usersId: z.string().min(3, { message: 'Debe se una cadena de al menos 3 caracteres' }),
    url: z.string().min(3, { message: 'Debes proveer una cadena de al menos 3 caracteres' }).nullable().optional(),
    title: z.string().min(3, { message: 'Debes proveer una cadena de al menos 3 carateres' }),
    photoUrl: z.string().min(3, { message: 'Debes proveer una cadena de al menos 3 caracteres' }).optional()

  })
})

export type createAdType = z.infer<typeof createAdSchema>['body']
