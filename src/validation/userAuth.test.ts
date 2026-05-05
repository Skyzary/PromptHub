import { describe, expect, it } from "vitest"
import { userAuthSchema } from "./userAuth"

describe("userAuthSchema", () => {
  it("should validate a correct email and password", () => {
    const validData = {
      email: "test@example.com",
      password: "Password123!"
    }
    const result = userAuthSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it("should fail on invalid email", () => {
    const invalidData = {
      email: "invalid-email",
      password: "Password123!"
    }
    const result = userAuthSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("email")
    }
  })

  it("should fail on short password", () => {
    const invalidData = {
      email: "test@example.com",
      password: "Pass1!"
    }
    const result = userAuthSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("password")
    }
  })

  it("should fail on password without special characters", () => {
    const invalidData = {
      email: "test@example.com",
      password: "Password123"
    }
    const result = userAuthSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Пароль должен содержать буквы, цифры и минимум один спецсимвол")
    }
  })

  it("should fail on password without digits", () => {
    const invalidData = {
      email: "test@example.com",
      password: "Password!"
    }
    const result = userAuthSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Пароль должен содержать буквы, цифры и минимум один спецсимвол")
    }
  })
})
