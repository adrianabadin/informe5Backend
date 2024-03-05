import { z } from 'zod'
export const SignUpSchema = z.object({
  body: z.object({
    username: z.string().email({ message: 'Debe ser un correo valido' }),
    password: z.string().min(3, { message: 'La contraseña debe tener al menos 3 caracteres' }),
    name: z.string().min(3, { message: 'El nombre debe tener al menos 3 caracteres' }),
    lastName: z.string().min(3, { message: 'El apellido debe tener al menos 3 caracteres' }),
    phone: z.string().min(3, { message: ' El telefono debe contener al menos 3 caracteres ' }).refine((value: string) => {
      for (let i = 0; i < value.length; i++) {
        const result = parseInt(value[i])
        if (isNaN(result)) {
          return false
        }
      }
      return true
    }, { message: ' Los caracteres del telefono deben ser numericos ' }),
    birthDate: z.string().min(10, { message: 'La fecha debe tener 10 caracteres' }).optional(), // date({invalid_type_error:"Debes proveer una fecha valida"}),
    gender: z.enum(['MALE', 'FEMALE', 'NOT_BINARY'], { invalid_type_error: 'El genero es requerido y debe ser: MALE, FEMALE, NOT_BINARY' }).optional()

  })
})

export type SignUpType = z.infer<typeof SignUpSchema>['body']
