import { describe, expect, it } from "vitest"

import User from "./userModule"

describe("User Model", () => {
  it("should have the correct schema", () => {
    const schema = User.schema.obj

    expect(schema).toHaveProperty("email")
    expect(schema.email).toMatchObject({
      type: String,
      required: true,
      unique: true
    })

    expect(schema).toHaveProperty("password")
    expect(schema.password).toMatchObject({ type: String, required: true })
  })

  it("should create a valid user instance", () => {
    const userData = {
      email: "test@example.com",
      password: "hashedpassword"
    }

    const user = new User(userData)

    expect(user.email).toBe(userData.email)
    expect(user.password).toBe(userData.password)
    expect(user.validateSync()).toBeUndefined()
  })

  it("should fail validation if required fields are missing", () => {
    const user = new User({})
    const validationError = user.validateSync()

    expect(validationError?.errors.email).toBeDefined()
    expect(validationError?.errors.password).toBeDefined()
  })
})
