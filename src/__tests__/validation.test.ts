import { describe, expect, it } from "vitest"

import {
  createPromptSchema,
  deletePromptSchema,
  updatePromptBodySchema,
  updatePromptTagsSchema,
  updatePromptTitleSchema
} from "~src/validation/prompt-validation"
import {
  updateEmailSchema,
  updatePasswordSchema,
  userSchema
} from "~src/validation/user-validation"

const VALID_OBJECT_ID = "65f1a2b3c4d5e6f7a8b9c0d1"

describe("prompt-validation", () => {
  it("validates createPromptSchema with valid input and trims values", () => {
    const parsed = createPromptSchema.parse({
      title: "  Code Review  ",
      body: "  Review this code carefully  ",
      tags: [" development ", "ts"]
    })

    expect(parsed).toEqual({
      title: "Code Review",
      body: "Review this code carefully",
      tags: ["development", "ts"]
    })
  })

  it("rejects invalid createPromptSchema inputs", () => {
    expect(() =>
      createPromptSchema.parse({
        title: "   ",
        body: "Valid body",
        tags: []
      })
    ).toThrow("Title is required")

    expect(() =>
      createPromptSchema.parse({
        title: "Valid title",
        body: "",
        tags: []
      })
    ).toThrow("Body is required")

    expect(() =>
      createPromptSchema.parse({
        title: "Valid title",
        body: "Valid body",
        tags: Array.from({ length: 11 }, (_, i) => `tag-${i}`)
      })
    ).toThrow("A prompt can have at most 10 tags")
  })

  it("validates updatePromptTitleSchema, updatePromptBodySchema, updatePromptTagsSchema, and deletePromptSchema", () => {
    expect(
      updatePromptTitleSchema.parse({
        promptId: VALID_OBJECT_ID,
        title: "New Title"
      })
    ).toEqual({
      promptId: VALID_OBJECT_ID,
      title: "New Title"
    })

    expect(
      updatePromptBodySchema.parse({
        promptId: VALID_OBJECT_ID,
        body: "Updated body"
      })
    ).toEqual({
      promptId: VALID_OBJECT_ID,
      body: "Updated body"
    })

    expect(
      updatePromptTagsSchema.parse({
        promptId: VALID_OBJECT_ID,
        tags: ["daily"]
      })
    ).toEqual({
      promptId: VALID_OBJECT_ID,
      tags: ["daily"]
    })

    expect(
      deletePromptSchema.parse({
        promptId: VALID_OBJECT_ID
      })
    ).toEqual({
      promptId: VALID_OBJECT_ID
    })
  })

  it("rejects invalid MongoDB ObjectId in update/delete schemas", () => {
    expect(() =>
      deletePromptSchema.parse({
        promptId: "invalid-id"
      })
    ).toThrow("Prompt ID must be a valid MongoDB ObjectId")
  })
})

describe("user-validation", () => {
  it("validates userSchema, updateEmailSchema, and updatePasswordSchema", () => {
    expect(
      userSchema.parse({
        email: "dev@example.com",
        password: "Password1!"
      })
    ).toEqual({
      email: "dev@example.com",
      password: "Password1!"
    })

    expect(
      updateEmailSchema.parse({
        newEmail: "new@example.com"
      })
    ).toEqual({
      newEmail: "new@example.com"
    })

    expect(
      updatePasswordSchema.parse({
        newPassword: "NewPassword1!"
      })
    ).toEqual({
      newPassword: "NewPassword1!"
    })
  })

  it("rejects weak passwords or invalid emails", () => {
    expect(() =>
      userSchema.parse({
        email: "dev@example.com",
        password: "short"
      })
    ).toThrow("Password must be at least 8 characters long")

    expect(() =>
      userSchema.parse({
        email: "dev@example.com",
        password: "alllowercase1234"
      })
    ).toThrow(
      "Password must contain at least one uppercase letter and one special character"
    )

    expect(() =>
      updateEmailSchema.parse({
        newEmail: "not-an-email"
      })
    ).toThrow()
  })
})
