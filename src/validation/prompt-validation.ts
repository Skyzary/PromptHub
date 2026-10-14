import * as z from "zod"

const promptIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Prompt ID must be a valid MongoDB ObjectId")

const titleSchema = z
  .string()
  .trim()
  .min(1, "Title is required")
  .max(100, "Title must be at most 100 characters long")

const bodySchema = z
  .string()
  .trim()
  .min(1, "Body is required")
  .max(10000, "Body must be at most 10000 characters long")

const tagsSchema = z
  .array(
    z
      .string()
      .trim()
      .min(1, "Tag cannot be empty")
      .max(30, "Tag must be at most 30 characters long")
  )
  .max(10, "A prompt can have at most 10 tags")

const iconSchema = z.string().trim().max(50).optional()

export const createPromptSchema = z.object({
  title: titleSchema,
  body: bodySchema,
  tags: tagsSchema,
  icon: iconSchema
})

export const updatePromptTitleSchema = z.object({
  promptId: promptIdSchema,
  title: titleSchema
})

export const updatePromptBodySchema = z.object({
  promptId: promptIdSchema,
  body: bodySchema
})

export const updatePromptTagsSchema = z.object({
  promptId: promptIdSchema,
  tags: tagsSchema
})

export const deletePromptSchema = z.object({
  promptId: promptIdSchema
})
