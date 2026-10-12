import * as z from "zod"

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters long")
  .max(32, "Password must be at most 32 characters long")
  .regex(
    /^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-[\]{};':"\\|,.<>/?]).+$/,
    "Password must contain at least one uppercase letter and one special character"
  )

export const userSchema = z.object({
  email: z.email(),
  password: passwordSchema
})

export const updateEmailSchema = z.object({
  newEmail: z.email()
})

export const updatePasswordSchema = z.object({
  newPassword: passwordSchema
})

export const deleteUserSchema = z.object({
  password: passwordSchema
})
