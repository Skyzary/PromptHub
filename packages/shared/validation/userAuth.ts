import * as z from "zod"

export const userAuthSchema = z.object({
  email: z.string().email(),
  password: z
    .string()
    .min(8)
    .max(32)
    .regex(
      /^(?=.*[A-Za-z])(?=.*\d)(?=.*[\W_])\S{8,32}$/,
      "Пароль должен содержать буквы, цифры и минимум один спецсимвол"
    )
})

export type User = z.infer<typeof userAuthSchema>
