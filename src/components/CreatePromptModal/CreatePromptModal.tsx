import React, { useState } from "react"
import * as z from "zod"

import Btn from "~src/components/ui/Btn/Btn"
import { createPrompt, invalidatePromptsCache } from "~src/prompts-api"

import css from "./CreatePromptModal.module.scss"

const PRESET_TAGS = [
  "development",
  "daily",
  "education",
  "entertainment",
  "other"
] as const

interface CreatePromptModalProps {
  isOpen: boolean
  onClose: () => void
  onCreated?: () => void
}

export default function CreatePromptModal({
  isOpen,
  onClose,
  onCreated
}: CreatePromptModalProps) {
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [selectedTags, setSelectedTags] = useState<string[]>(["development"])
  const [customTagsInput, setCustomTagsInput] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) {
    return null
  }

  const togglePresetTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  const resetForm = () => {
    setTitle("")
    setBody("")
    setSelectedTags(["development"])
    setCustomTagsInput("")
    setError(null)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleCreatePrompt = async () => {
    if (isSubmitting) {
      return
    }
    setError(null)
    setIsSubmitting(true)

    const customTags = customTagsInput
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean)

    const tags = Array.from(new Set([...selectedTags, ...customTags]))

    try {
      await createPrompt({ title, body, tags })
      invalidatePromptsCache()
      resetForm()
      onCreated?.()
      onClose()
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.issues[0]?.message || "Validation error")
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("Failed to create prompt")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    await handleCreatePrompt()
  }

  return (
    <div
      className={css.overlay}
      onClick={handleClose}>
      <div
        className={css.modal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-prompt-title">
        <div className={css.modalHeader}>
          <h2
            id="create-prompt-title"
            className={css.modalTitle}>
            New Prompt
          </h2>
          <button
            type="button"
            className={css.closeBtn}
            onClick={handleClose}
            aria-label="Close modal">
            ×
          </button>
        </div>

        <form
          className={css.form}
          onSubmit={handleSubmit}
          noValidate>
          <div className={css.fieldGroup}>
            <label
              htmlFor="prompt-title"
              className={css.label}>
              Title
            </label>
            <input
              id="prompt-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Code Review Assistant"
              className={css.input}
              maxLength={100}
              required
            />
          </div>

          <div className={css.fieldGroup}>
            <label
              htmlFor="prompt-body"
              className={css.label}>
              Prompt text
            </label>
            <textarea
              id="prompt-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your prompt template here..."
              className={css.textarea}
              maxLength={10000}
              required
            />
          </div>

          <div className={css.fieldGroup}>
            <span className={css.label}>Category & Tags</span>
            <div className={css.presetTags}>
              {PRESET_TAGS.map((tag) => {
                const isActive = selectedTags.includes(tag)
                return (
                  <button
                    key={tag}
                    type="button"
                    className={`${css.tagChip} ${isActive ? css.tagChipActive : ""}`}
                    onClick={() => togglePresetTag(tag)}>
                    {tag}
                  </button>
                )
              })}
            </div>
            <input
              id="prompt-custom-tags"
              type="text"
              value={customTagsInput}
              onChange={(e) => setCustomTagsInput(e.target.value)}
              placeholder="Additional tags (comma separated)"
              className={css.input}
            />
          </div>

          {error && <div className={css.errorBox}>{error}</div>}

          <div className={css.actions}>
            <Btn
              type="button"
              styleType="secondary"
              onClick={handleClose}
              disabled={isSubmitting}
              className={css.actionBtn}>
              Cancel
            </Btn>
            <Btn
              type="button"
              styleType="primary"
              onClick={() => void handleCreatePrompt()}
              disabled={isSubmitting}
              className={css.actionBtn}>
              {isSubmitting ? "Creating..." : "Create"}
            </Btn>
          </div>
        </form>
      </div>
    </div>
  )
}
