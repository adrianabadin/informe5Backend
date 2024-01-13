import { z } from 'zod'
export const createAdSchema = z.object({
  body: z.object({
    importance: z.string().refine((value) => {
      const parsed = parseInt(value)
      if (isNaN(parsed)) return false
      if (parsed > 0 && parsed < 5) return true
      else return false
    }, { message: 'Debes proveer un caracter de numero del 1 al 4' }),
    usersId: z.string().min(3, { message: 'Debe se una cadena de al menos 3 caracteres' }),
    url: z.string().min(3, { message: 'Debes proveer una cadena de al menos 3 caracteres' }).nullable().optional(),
    title: z.string().min(3, { message: 'Debes proveer una cadena de al menos 3 carateres' })

  })
})

export type createAdType = z.infer<typeof createAdSchema>['body']
