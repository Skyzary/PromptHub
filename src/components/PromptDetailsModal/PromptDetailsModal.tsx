import React, { useEffect, useState } from "react"
import { IoPricetagsOutline } from "react-icons/io5"
import {
  MdCheck,
  MdClose,
  MdContentCopy,
  MdDeleteOutline,
  MdEdit,
  MdEditNote
} from "react-icons/md"
import * as z from "zod"

import IconPicker from "~src/components/IconPicker/IconPicker"
import TemplateHighlight from "~src/components/TemplateHighlight/TemplateHighlight"
import Btn from "~src/components/ui/Btn/Btn"
import {
  deletePrompt,
  updatePromptBody,
  updatePromptTags,
  updatePromptTitle
} from "~src/prompts-api"
import type { IPrompt } from "~src/types"
import { resolvePromptIcon, setPromptIcon } from "~src/utils/prompt-icons"
import { hasTemplateVariables } from "~src/utils/template"

import css from "./PromptDetailsModal.module.scss"

interface PromptDetailsModalProps {
  prompt: IPrompt | null
  isOpen: boolean
  onClose: () => void
  onUpdated?: (updatedPrompt: IPrompt) => void
  onDeleted?: (promptId: string) => void
}

function getPromptId(prompt: IPrompt): string {
  const withFallbackId = prompt as IPrompt & { id?: string; promptId?: string }
  return prompt._id ?? withFallbackId.id ?? withFallbackId.promptId ?? ""
}

export default function PromptDetailsModal({
  prompt,
  isOpen,
  onClose,
  onUpdated,
  onDeleted
}: PromptDetailsModalProps) {
  const [currentPrompt, setCurrentPrompt] = useState<IPrompt | null>(prompt)
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [customTagsInput, setCustomTagsInput] = useState("")

  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [isEditingBody, setIsEditingBody] = useState(false)
  const [isEditingTags, setIsEditingTags] = useState(false)
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)

  const [isSavingTitle, setIsSavingTitle] = useState(false)
  const [isSavingBody, setIsSavingBody] = useState(false)
  const [isSavingTags, setIsSavingTags] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setCurrentPrompt(prompt)
    if (prompt) {
      setTitle(prompt.title)
      setBody(prompt.body)
      setCustomTagsInput((prompt.tags ?? []).join(", "))
    }
    setIsEditingTitle(false)
    setIsEditingBody(false)
    setIsEditingTags(false)
    setIsConfirmingDelete(false)
    setError(null)
    setCopied(false)
  }, [prompt])

  if (!isOpen || !currentPrompt) {
    return null
  }

  const promptId = getPromptId(currentPrompt)
  const isBusy = isSavingTitle || isSavingBody || isSavingTags || isDeleting

  const formatError = (err: unknown, fallback: string): string => {
    if (err instanceof z.ZodError) {
      return err.issues[0]?.message || "Validation error"
    }
    if (err instanceof Error) {
      return err.message
    }
    return fallback
  }

  const buildCombinedTags = (): string[] => {
    const customTags = customTagsInput
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean)
    return Array.from(new Set(customTags))
  }

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(currentPrompt.body)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      setError("Failed to copy prompt to clipboard")
    }
  }

  const handleSaveTitle = async () => {
    if (isBusy) return
    setError(null)
    setIsSavingTitle(true)
    try {
      const trimmedTitle = title.trim()
      await updatePromptTitle({ promptId, title: trimmedTitle })
      const updated: IPrompt = {
        ...currentPrompt,
        title: trimmedTitle,
        updatedAt: new Date()
      }
      setCurrentPrompt(updated)
      setTitle(trimmedTitle)
      setIsEditingTitle(false)
      onUpdated?.(updated)
    } catch (err) {
      setError(formatError(err, "Failed to update title"))
    } finally {
      setIsSavingTitle(false)
    }
  }

  const handleSaveBody = async () => {
    if (isBusy) return
    setError(null)
    setIsSavingBody(true)
    try {
      const trimmedBody = body.trim()
      await updatePromptBody({ promptId, body: trimmedBody })
      const updated: IPrompt = {
        ...currentPrompt,
        body: trimmedBody,
        updatedAt: new Date()
      }
      setCurrentPrompt(updated)
      setBody(trimmedBody)
      setIsEditingBody(false)
      onUpdated?.(updated)
    } catch (err) {
      setError(formatError(err, "Failed to update prompt text"))
    } finally {
      setIsSavingBody(false)
    }
  }

  const handleSaveTags = async () => {
    if (isBusy) return
    setError(null)
    setIsSavingTags(true)
    try {
      const nextTags = buildCombinedTags()
      await updatePromptTags({ promptId, tags: nextTags })
      const updated: IPrompt = {
        ...currentPrompt,
        tags: nextTags,
        updatedAt: new Date()
      }
      setCurrentPrompt(updated)
      setCustomTagsInput(nextTags.join(", "))
      setIsEditingTags(false)
      onUpdated?.(updated)
    } catch (err) {
      setError(formatError(err, "Failed to update tags"))
    } finally {
      setIsSavingTags(false)
    }
  }

  const handleSaveAllOpenEdits = async () => {
    if (isBusy) return
    setError(null)
    let updated: IPrompt = { ...currentPrompt }

    try {
      if (isEditingTitle) {
        setIsSavingTitle(true)
        const trimmedTitle = title.trim()
        await updatePromptTitle({ promptId, title: trimmedTitle })
        updated = { ...updated, title: trimmedTitle, updatedAt: new Date() }
        setTitle(trimmedTitle)
        setIsEditingTitle(false)
        setIsSavingTitle(false)
      }

      if (isEditingTags) {
        setIsSavingTags(true)
        const nextTags = buildCombinedTags()
        await updatePromptTags({ promptId, tags: nextTags })
        updated = { ...updated, tags: nextTags, updatedAt: new Date() }
        setCustomTagsInput(nextTags.join(", "))
        setIsEditingTags(false)
        setIsSavingTags(false)
      }

      if (isEditingBody) {
        setIsSavingBody(true)
        const trimmedBody = body.trim()
        await updatePromptBody({ promptId, body: trimmedBody })
        updated = { ...updated, body: trimmedBody, updatedAt: new Date() }
        setBody(trimmedBody)
        setIsEditingBody(false)
        setIsSavingBody(false)
      }

      setCurrentPrompt(updated)
      onUpdated?.(updated)
    } catch (err) {
      setIsSavingTitle(false)
      setIsSavingTags(false)
      setIsSavingBody(false)
      setError(formatError(err, "Failed to save changes"))
    }
  }

  const handleDeletePrompt = async () => {
    if (isBusy) return
    setError(null)
    setIsDeleting(true)
    try {
      await deletePrompt({ promptId })
      onDeleted?.(promptId)
      onClose()
    } catch (err) {
      setError(formatError(err, "Failed to delete prompt"))
    } finally {
      setIsDeleting(false)
    }
  }

  const cancelTitleEdit = () => {
    setTitle(currentPrompt.title)
    setIsEditingTitle(false)
    setError(null)
  }

  const cancelBodyEdit = () => {
    setBody(currentPrompt.body)
    setIsEditingBody(false)
    setError(null)
  }

  const cancelTagsEdit = () => {
    setCustomTagsInput((currentPrompt.tags ?? []).join(", "))
    setIsEditingTags(false)
    setError(null)
  }

  const handleIconChange = async (newIcon: string) => {
    if (!currentPrompt) return
    const id = getPromptId(currentPrompt)
    if (id) {
      await setPromptIcon(id, newIcon)
    }
    if (currentPrompt.title) {
      await setPromptIcon(currentPrompt.title, newIcon)
    }
    const updated = { ...currentPrompt, icon: newIcon }
    setCurrentPrompt(updated)
    onUpdated?.(updated)
  }

  const isAnyEditing = isEditingTitle || isEditingBody || isEditingTags

  return (
    <div
      className={css.overlay}
      onClick={onClose}>
      <div
        className={css.modal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="prompt-details-title">
        {/* Header + Title Section */}
        <div className={css.modalHeader}>
          <div className={css.headerMain}>
            <IconPicker
              compact
              value={currentPrompt.icon ?? resolvePromptIcon(currentPrompt)}
              onChange={handleIconChange}
            />
            <div className={css.titleDisplayRow}>
              <h2
                id="prompt-details-title"
                className={css.modalTitle}>
                {currentPrompt.title}
              </h2>
              {!isEditingTitle && (
                <button
                  type="button"
                  className={`${css.iconActionBtn} ${css.editTitleBtn}`}
                  onClick={() => setIsEditingTitle(true)}
                  disabled={isBusy}>
                  <MdEdit size={13} />
                  <span>Edit title</span>
                </button>
              )}
            </div>
          </div>
          <button
            type="button"
            className={css.closeBtn}
            onClick={onClose}
            aria-label="Close modal">
            <MdClose size={16} />
          </button>
        </div>

        {/* Inline Title Editor (when active) */}
        {isEditingTitle && (
          <div className={css.section}>
            <span className={css.label}>Edit Title</span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Prompt title"
              className={css.input}
              maxLength={100}
              autoFocus
            />
            <div className={css.editButtonsRow}>
              <button
                type="button"
                className={`${css.iconActionBtn} ${css.cancelInlineBtn} ${css.editSectionBtn}`}
                onClick={cancelTitleEdit}
                disabled={isBusy}>
                <MdClose size={14} />
                <span>Cancel</span>
              </button>
              <button
                type="button"
                className={`${css.iconActionBtn} ${css.saveInlineBtn} ${css.editSectionBtn}`}
                onClick={() => void handleSaveTitle()}
                disabled={isBusy}>
                <MdCheck size={14} />
                <span>{isSavingTitle ? "Saving..." : "Save title"}</span>
              </button>
            </div>
          </div>
        )}

        {/* Tags Section */}
        <div className={css.section}>
          <div className={css.sectionHeader}>
            <span className={css.label}>Tags</span>
            {!isEditingTags && (
              <div className={css.inlineActions}>
                <button
                  type="button"
                  className={`${css.iconActionBtn} ${css.editTagsBtn}`}
                  onClick={() => setIsEditingTags(true)}
                  disabled={isBusy}>
                  <IoPricetagsOutline size={13} />
                  <span>Edit tags</span>
                </button>
              </div>
            )}
          </div>

          {isEditingTags ? (
            <>
              <input
                type="text"
                value={customTagsInput}
                onChange={(e) => setCustomTagsInput(e.target.value)}
                placeholder="Tags (comma separated)"
                className={css.input}
              />
              <div className={css.editButtonsRow}>
                <button
                  type="button"
                  className={`${css.iconActionBtn} ${css.cancelInlineBtn} ${css.editSectionBtn}`}
                  onClick={cancelTagsEdit}
                  disabled={isBusy}>
                  <MdClose size={14} />
                  <span>Cancel</span>
                </button>
                <button
                  type="button"
                  className={`${css.iconActionBtn} ${css.saveInlineBtn} ${css.editSectionBtn}`}
                  onClick={() => void handleSaveTags()}
                  disabled={isBusy}>
                  <MdCheck size={14} />
                  <span>{isSavingTags ? "Saving..." : "Save tags"}</span>
                </button>
              </div>
            </>
          ) : (
            <div className={css.tagsList}>
              {currentPrompt.tags && currentPrompt.tags.length > 0 ? (
                currentPrompt.tags.map((tag) => (
                  <span
                    key={tag}
                    className={css.tagBadge}>
                    {tag}
                  </span>
                ))
              ) : (
                <span className={css.emptyTags}>No tags</span>
              )}
            </div>
          )}
        </div>

        {/* Prompt Body Section */}
        <div className={css.section}>
          <div className={css.sectionHeader}>
            <span className={css.label}>Prompt Text</span>
            <div className={css.inlineActions}>
              <button
                type="button"
                className={`${css.iconActionBtn} ${css.copyActionBtn}`}
                onClick={() => void handleCopyPrompt()}>
                {copied ? <MdCheck size={14} /> : <MdContentCopy size={13} />}
                <span>{copied ? "Copied!" : "Copy"}</span>
              </button>
              {!isEditingBody && (
                <button
                  type="button"
                  className={`${css.iconActionBtn} ${css.editPromptBtn}`}
                  onClick={() => setIsEditingBody(true)}
                  disabled={isBusy}>
                  <MdEditNote size={15} />
                  <span>Edit prompt</span>
                </button>
              )}
            </div>
          </div>

          {isEditingBody ? (
            <>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write your prompt template here..."
                className={css.textarea}
                maxLength={10000}
                autoFocus
              />
              {hasTemplateVariables(body) && (
                <div
                  className={css.templatePreviewBox}
                  data-testid="template-preview-box">
                  <span className={css.templatePreviewLabel}>
                    Template preview:
                  </span>
                  <TemplateHighlight text={body} />
                </div>
              )}
              <div className={css.editButtonsRow}>
                <button
                  type="button"
                  className={`${css.iconActionBtn} ${css.cancelInlineBtn} ${css.editSectionBtn}`}
                  onClick={cancelBodyEdit}
                  disabled={isBusy}>
                  <MdClose size={14} />
                  <span>Cancel</span>
                </button>
                <button
                  type="button"
                  className={`${css.iconActionBtn} ${css.saveInlineBtn} ${css.editSectionBtn}`}
                  onClick={() => void handleSaveBody()}
                  disabled={isBusy}>
                  <MdCheck size={14} />
                  <span>{isSavingBody ? "Saving..." : "Save prompt"}</span>
                </button>
              </div>
            </>
          ) : (
            <div className={css.bodyBox}>
              <TemplateHighlight text={currentPrompt.body} />
            </div>
          )}
        </div>

        {(currentPrompt.createdAt || currentPrompt.updatedAt) && (
          <div className={css.metaInfo}>
            {currentPrompt.createdAt && (
              <span>
                Created:{" "}
                {new Date(currentPrompt.createdAt).toLocaleDateString()}
              </span>
            )}
            {currentPrompt.updatedAt && (
              <span>
                Updated:{" "}
                {new Date(currentPrompt.updatedAt).toLocaleDateString()}
              </span>
            )}
          </div>
        )}

        {error && <div className={css.errorBox}>{error}</div>}

        {isConfirmingDelete ? (
          <div className={css.deleteConfirmBox}>
            <span className={css.deleteConfirmText}>
              Are you sure you want to delete this prompt?
            </span>
            <div className={css.deleteConfirmActions}>
              <Btn
                type="button"
                styleType="secondary"
                onClick={() => setIsConfirmingDelete(false)}
                disabled={isBusy}
                className={css.actionBtn}>
                <MdClose size={15} />
                <span>Cancel</span>
              </Btn>
              <button
                type="button"
                className={css.deleteBtn}
                onClick={() => void handleDeletePrompt()}
                disabled={isBusy}>
                <MdDeleteOutline size={16} />
                <span>{isDeleting ? "Deleting..." : "Confirm Delete"}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className={css.footerActions}>
            <button
              type="button"
              className={css.deleteBtn}
              onClick={() => setIsConfirmingDelete(true)}
              disabled={isBusy}>
              <MdDeleteOutline size={16} />
              <span>Delete</span>
            </button>
            {isAnyEditing ? (
              <Btn
                type="button"
                styleType="primary"
                onClick={() => void handleSaveAllOpenEdits()}
                disabled={isBusy}
                className={css.actionBtn}>
                <MdCheck size={16} />
                <span>{isBusy ? "Saving..." : "Save changes"}</span>
              </Btn>
            ) : (
              <Btn
                type="button"
                styleType="secondary"
                onClick={onClose}
                disabled={isBusy}
                className={css.actionBtn}>
                <MdClose size={15} />
                <span>Close</span>
              </Btn>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
