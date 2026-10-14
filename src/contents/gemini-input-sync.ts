import { hasTemplateVariables, stripTemplateBrackets } from "../utils/template"
import { getGeminiInputText, setCollapsedInputCursor } from "./gemini-selection"
import {
  highlightActiveVariableElement,
  resetModifiedTemplateVariables
} from "./gemini-template-state"
import { TemplateHighlighter } from "./TemplateHighlighter"

export let isProgrammaticInsert = false

export function setProgrammaticInsert(value: boolean): void {
  isProgrammaticInsert = value
}

/**
 * Helper to dispatch an input event and change event on an input element.
 */
export function dispatchInputEvent(element: HTMLElement, data: string): void {
  isProgrammaticInsert = true
  try {
    const isTextarea =
      element instanceof HTMLTextAreaElement ||
      element instanceof HTMLInputElement
    const richContainer = element.closest<HTMLElement>("rich-textarea")
    const target = !isTextarea && richContainer ? richContainer : element

    const inputEvent =
      typeof InputEvent === "function"
        ? new InputEvent("input", {
            bubbles: true,
            cancelable: true,
            ...(isTextarea && data ? { data, inputType: "insertText" } : {})
          })
        : new Event("input", { bubbles: true })

    target.dispatchEvent(inputEvent)
    target.dispatchEvent(new Event("change", { bubbles: true }))
  } finally {
    if (typeof setTimeout === "function") {
      setTimeout(() => {
        isProgrammaticInsert = false
      }, 50)
    } else {
      isProgrammaticInsert = false
    }
  }
}

/**
 * Strips {{ and }} from template variables in the input element upon submission,
 * leaving only the substituted contents. Synchronously updates Quill delta,
 * contenteditable text, and textarea values so Gemini sends clean text.
 */
export function cleanTemplateBracketsInInput(element: HTMLElement): boolean {
  isProgrammaticInsert = true
  try {
  const currentText = getGeminiInputText(element)
  if (!hasTemplateVariables(currentText)) {
    return false
  }

  const cleanedText = stripTemplateBrackets(currentText)

  if (
    element instanceof HTMLTextAreaElement ||
    element instanceof HTMLInputElement
  ) {
    element.value = cleanedText
    element.dispatchEvent(new Event("input", { bubbles: true }))
    element.dispatchEvent(new Event("change", { bubbles: true }))
    return true
  }

  // 1. Direct Quill instance update if accessible
  const anyEl = element as unknown as {
    __quill?: { setText?: (t: string) => void }
    parentElement?: { __quill?: { setText?: (t: string) => void } }
  }
  const richTextarea = element.closest("rich-textarea") as unknown as {
    quill?: { setText?: (t: string) => void }
    __quill?: { setText?: (t: string) => void }
  } | null
  const qlContainer = element.closest(".ql-container") as unknown as {
    __quill?: { setText?: (t: string) => void }
  } | null

  const quillInstance =
    anyEl.__quill ||
    anyEl.parentElement?.__quill ||
    richTextarea?.quill ||
    richTextarea?.__quill ||
    qlContainer?.__quill

  if (quillInstance && typeof quillInstance.setText === "function") {
    try {
      quillInstance.setText(cleanedText)
    } catch {
      // Continue to next sync methods
    }
  }

  // 2. Synchronous native execCommand insertion
  // In contenteditable editors (including Quill), document.execCommand generates
  // synchronous beforeinput/input events which update the editor model immediately.
  let execSuccess = false
  if (
    typeof document !== "undefined" &&
    typeof document.execCommand === "function"
  ) {
    try {
      element.focus()
      const sel = window.getSelection()
      if (sel) {
        const range = document.createRange()
        range.selectNodeContents(element)
        sel.removeAllRanges()
        sel.addRange(range)
        execSuccess = document.execCommand("insertText", false, cleanedText)
      }
    } catch {
      execSuccess = false
    }
  }

  // 3. Fallback direct DOM update (if execCommand failed or text still has template braces)
  if (!execSuccess || hasTemplateVariables(getGeminiInputText(element))) {
    const paragraph = element.querySelector("p")
    if (paragraph) {
      paragraph.textContent = cleanedText
    } else {
      element.textContent = cleanedText
    }
  }

  // 4. Dispatch InputEvent and change event for framework reactivity
  const inputEvent =
    typeof InputEvent === "function"
      ? new InputEvent("input", {
          bubbles: true,
          cancelable: true,
          data: cleanedText,
          inputType: "insertText"
        })
      : new Event("input", { bubbles: true })

  element.dispatchEvent(inputEvent)
  element.dispatchEvent(new Event("change", { bubbles: true }))

  return true
  } finally {
    if (typeof setTimeout === "function") {
      setTimeout(() => {
        isProgrammaticInsert = false
      }, 50)
    } else {
      isProgrammaticInsert = false
    }
  }
}

/**
 * Inserts prompt text into the Gemini input element (handling both
 * textarea/input and contenteditable Quill editors). If the prompt contains
 * template variables {{...}}, they are highlighted in blue, the first variable
 * is marked active with .ph-template-variable-active, and a collapsed cursor
 * is placed inside without applying standard text selection highlight.
 */
export function insertTextIntoGeminiInput(
  element: HTMLElement,
  text: string
): void {
  isProgrammaticInsert = true
  try {
    resetModifiedTemplateVariables()
  TemplateHighlighter.applyHighlightClasses(element)
  element.focus()

  const vars = TemplateHighlighter.findVariablesInText(text)
  const hasVars = vars.length > 0

  if (
    element instanceof HTMLTextAreaElement ||
    element instanceof HTMLInputElement
  ) {
    element.value = text
    element.dispatchEvent(new Event("input", { bubbles: true }))
    element.dispatchEvent(new Event("change", { bubbles: true }))

    if (hasVars) {
      setCollapsedInputCursor(element, vars[0].innerEnd)
    }
    return
  }

  // 1. If Quill instance is present, update its text model first
  const anyEl = element as unknown as {
    __quill?: { setText?: (t: string) => void }
    parentElement?: { __quill?: { setText?: (t: string) => void } }
  }
  const richTextarea = element.closest("rich-textarea") as unknown as {
    quill?: { setText?: (t: string) => void }
    __quill?: { setText?: (t: string) => void }
  } | null
  const qlContainer = element.closest(".ql-container") as unknown as {
    __quill?: { setText?: (t: string) => void }
  } | null

  const quillInstance =
    anyEl.__quill ||
    anyEl.parentElement?.__quill ||
    richTextarea?.quill ||
    richTextarea?.__quill ||
    qlContainer?.__quill

  if (!hasVars && quillInstance && typeof quillInstance.setText === "function") {
    try {
      quillInstance.setText(text)
    } catch {
      // Continue to next sync methods
    }
  }

  const paragraph = element.querySelector("p")
  const targetContainer = paragraph ?? element
  if (hasVars) {
    TemplateHighlighter.appendTemplateNodes(targetContainer, text)
  } else {
    targetContainer.textContent = text
  }

  const richContainer = element.closest<HTMLElement>("rich-textarea")
  const eventTarget: HTMLElement =
    hasVars && richContainer ? richContainer : element

  // Dispatch change and non-destructive generic input event
  // Avoid dispatching directly to ql-editor when hasVars is true,
  // as Quill will parse it as plain text and wipe all custom DOM nodes!
  const inputEvent =
    typeof InputEvent === "function"
      ? new InputEvent("input", {
          bubbles: true,
          cancelable: true,
          ...(hasVars ? {} : { data: text, inputType: "insertText" })
        })
      : new Event("input", { bubbles: true })

  eventTarget.dispatchEvent(inputEvent)
  eventTarget.dispatchEvent(new Event("change", { bubbles: true }))

  if (hasVars) {
    const setInitialCursor = () => {
      highlightActiveVariableElement(element, 0)
      const activeSpan = element.querySelector(
        `.${TemplateHighlighter.ACTIVE_CLASS}`
      )
      if (
        activeSpan &&
        activeSpan.firstChild &&
        typeof window !== "undefined"
      ) {
        const sel = window.getSelection()
        if (sel) {
          const range = document.createRange()
          range.setStart(activeSpan.firstChild, 2)
          range.setEnd(activeSpan.firstChild, 2)
          sel.removeAllRanges()
          sel.addRange(range)
          return
        }
      }
      setCollapsedInputCursor(element, vars[0].innerEnd)
    }

    setInitialCursor()
    if (typeof setTimeout === "function") {
      setTimeout(setInitialCursor, 0)
      setTimeout(setInitialCursor, 50)
    }
  }
  } finally {
    if (typeof setTimeout === "function") {
      setTimeout(() => {
        isProgrammaticInsert = false
      }, 100)
    } else {
      isProgrammaticInsert = false
    }
  }
}
