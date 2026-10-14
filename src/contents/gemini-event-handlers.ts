import { hasTemplateVariables } from "../utils/template"
import {
  findGeminiInput,
  GEMINI_INPUT_SELECTOR,
  isGeminiSendButton
} from "./gemini-elements"
import {
  cleanTemplateBracketsInInput,
  dispatchInputEvent
} from "./gemini-input-sync"
import {
  getGeminiInputText,
  getInputSelectionOffsets,
  setCollapsedInputCursor
} from "./gemini-selection"
import {
  isVariableModified,
  jumpToNextTemplateVariable,
  modifiedVariableIndices
} from "./gemini-template-state"
import { TemplateHighlighter } from "./TemplateHighlighter"

/**
 * Intercepts send triggers (click, mousedown, pointerdown) to strip template brackets
 * across all Gemini input elements before the message is sent.
 */
export function handleGeminiSendTrigger(
  event: Event,
  explicitInput: HTMLElement | null = null
): boolean {
  if (isGeminiSendButton(event.target)) {
    let anyCleaned = false

    if (explicitInput && cleanTemplateBracketsInInput(explicitInput)) {
      anyCleaned = true
    }

    if (typeof document !== "undefined") {
      const inputs = document.querySelectorAll<HTMLElement>(
        GEMINI_INPUT_SELECTOR
      )
      inputs.forEach((inp) => {
        if (cleanTemplateBracketsInInput(inp)) {
          anyCleaned = true
        }
      })
    }

    return anyCleaned
  }
  return false
}

/**
 * Intercepts user typing inside an unmodified template variable.
 * Erases the placeholder variable name immediately as soon as the user starts
 * typing their own value, replacing it with the typed character or clearing on Backspace/Delete.
 */
export function handleTemplateVariableTyping(
  inputElement: HTMLElement,
  event: KeyboardEvent,
  isPrintable: boolean,
  isBackspaceOrDelete: boolean
): boolean {
  // Method 1: ContentEditable DOM span (.ph-template-variable)
  if (typeof window !== "undefined") {
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      const node = range.startContainer
      let span: HTMLElement | null = null
      if (node instanceof HTMLElement) {
        span = node.classList.contains(TemplateHighlighter.VARIABLE_CLASS)
          ? node
          : node.closest<HTMLElement>(`.${TemplateHighlighter.VARIABLE_CLASS}`)
      } else if (node.parentElement) {
        span = node.parentElement.closest<HTMLElement>(
          `.${TemplateHighlighter.VARIABLE_CLASS}`
        )
      }

      // Check if active variable class is present in input
      if (!span) {
        const activeSpan = inputElement.querySelector<HTMLElement>(
          `.${TemplateHighlighter.ACTIVE_CLASS}`
        )
        if (activeSpan && activeSpan.getAttribute("data-ph-modified") !== "true") {
          span = activeSpan
        }
      }

      if (span && inputElement.contains(span)) {
        if (span.getAttribute("data-ph-modified") === "true") {
          return false
        }

        span.setAttribute("data-ph-modified", "true")

        if (isBackspaceOrDelete) {
          event.preventDefault()
          event.stopPropagation()
          span.textContent = "{{}}"
          if (span.firstChild) {
            const newRange = document.createRange()
            newRange.setStart(span.firstChild, 2)
            newRange.setEnd(span.firstChild, 2)
            selection.removeAllRanges()
            selection.addRange(newRange)
          }
          dispatchInputEvent(inputElement, "")
          return true
        }

        if (isPrintable) {
          event.preventDefault()
          event.stopPropagation()
          const char = event.key
          span.textContent = `{{${char}}}`
          if (span.firstChild) {
            const newRange = document.createRange()
            newRange.setStart(span.firstChild, 2 + char.length)
            newRange.setEnd(span.firstChild, 2 + char.length)
            selection.removeAllRanges()
            selection.addRange(newRange)
          }
          dispatchInputEvent(inputElement, char)
          return true
        }
      }
    }
  }

  // Method 2: Textarea / Input or fallback
  const text = getGeminiInputText(inputElement)
  const vars = TemplateHighlighter.findVariablesInText(text)
  if (vars.length === 0) return false

  const selection = getInputSelectionOffsets(inputElement)
  if (!selection) return false

  const currentVar = vars.find(
    (v) =>
      (selection.start >= v.fullStart && selection.start <= v.fullEnd) ||
      (selection.end >= v.fullStart && selection.end <= v.fullEnd)
  )

  if (!currentVar) return false

  if (modifiedVariableIndices.has(currentVar.index)) {
    return false
  }

  modifiedVariableIndices.add(currentVar.index)

  if (
    inputElement instanceof HTMLTextAreaElement ||
    inputElement instanceof HTMLInputElement
  ) {
    if (isBackspaceOrDelete) {
      event.preventDefault()
      event.stopPropagation()
      const before = text.slice(0, currentVar.fullStart)
      const after = text.slice(currentVar.fullEnd)
      inputElement.value = before + "{{}}" + after
      const newCursorPos = currentVar.fullStart + 2
      inputElement.setSelectionRange(newCursorPos, newCursorPos)
      inputElement.dispatchEvent(new Event("input", { bubbles: true }))
      inputElement.dispatchEvent(new Event("change", { bubbles: true }))
      return true
    }

    if (isPrintable) {
      event.preventDefault()
      event.stopPropagation()
      const char = event.key
      const before = text.slice(0, currentVar.fullStart)
      const after = text.slice(currentVar.fullEnd)
      inputElement.value = before + `{{${char}}}` + after
      const newCursorPos = currentVar.fullStart + 2 + char.length
      inputElement.setSelectionRange(newCursorPos, newCursorPos)
      inputElement.dispatchEvent(new Event("input", { bubbles: true }))
      inputElement.dispatchEvent(new Event("change", { bubbles: true }))
      return true
    }
  } else {
    // Contenteditable fallback (e.g. Quill without span wrapper)
    if (isBackspaceOrDelete) {
      event.preventDefault()
      event.stopPropagation()
      const before = text.slice(0, currentVar.fullStart)
      const after = text.slice(currentVar.fullEnd)
      const newText = before + "{{}}" + after
      const paragraph = inputElement.querySelector("p")
      const targetContainer = paragraph ?? inputElement
      targetContainer.textContent = newText
      const newCursorPos = currentVar.fullStart + 2
      setCollapsedInputCursor(inputElement, newCursorPos)
      dispatchInputEvent(inputElement, "")
      return true
    }

    if (isPrintable) {
      event.preventDefault()
      event.stopPropagation()
      const char = event.key
      const before = text.slice(0, currentVar.fullStart)
      const after = text.slice(currentVar.fullEnd)
      const newText = before + `{{${char}}}` + after
      const paragraph = inputElement.querySelector("p")
      const targetContainer = paragraph ?? inputElement
      targetContainer.textContent = newText
      const newCursorPos = currentVar.fullStart + 2 + char.length
      setCollapsedInputCursor(inputElement, newCursorPos)
      dispatchInputEvent(inputElement, char)
      return true
    }
  }

  return false
}

/**
 * Intercepts paste events inside an unmodified template variable.
 * Replaces the placeholder variable name immediately with the pasted text.
 */
export function handleGeminiTemplatePaste(event: ClipboardEvent): boolean {
  const target = event.target
  if (!(target instanceof HTMLElement)) return false
  const inputElement = target.closest<HTMLElement>(GEMINI_INPUT_SELECTOR)
  if (!inputElement) return false

  const pastedText = event.clipboardData?.getData("text")
  if (!pastedText) return false

  if (typeof window !== "undefined") {
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      const node = selection.getRangeAt(0).startContainer
      const span =
        node instanceof Element
          ? node.closest<HTMLElement>(`.${TemplateHighlighter.VARIABLE_CLASS}`)
          : node.parentElement?.closest<HTMLElement>(
              `.${TemplateHighlighter.VARIABLE_CLASS}`
            )

      if (
        span &&
        inputElement.contains(span) &&
        span.getAttribute("data-ph-modified") !== "true"
      ) {
        event.preventDefault()
        event.stopPropagation()
        span.setAttribute("data-ph-modified", "true")
        span.textContent = `{{${pastedText}}}`
        if (span.firstChild) {
          const newRange = document.createRange()
          newRange.setStart(span.firstChild, 2 + pastedText.length)
          newRange.setEnd(span.firstChild, 2 + pastedText.length)
          selection.removeAllRanges()
          selection.addRange(newRange)
        }
        dispatchInputEvent(inputElement, pastedText)
        return true
      }
    }
  }

  if (
    inputElement instanceof HTMLTextAreaElement ||
    inputElement instanceof HTMLInputElement
  ) {
    const text = inputElement.value
    const vars = TemplateHighlighter.findVariablesInText(text)
    const start = inputElement.selectionStart ?? 0
    const end = inputElement.selectionEnd ?? 0
    const currentVar = vars.find(
      (v) =>
        (start >= v.fullStart && start <= v.fullEnd) ||
        (end >= v.fullStart && end <= v.fullEnd)
    )

    if (currentVar && !modifiedVariableIndices.has(currentVar.index)) {
      event.preventDefault()
      event.stopPropagation()
      modifiedVariableIndices.add(currentVar.index)
      const before = text.slice(0, currentVar.fullStart)
      const after = text.slice(currentVar.fullEnd)
      inputElement.value = before + `{{${pastedText}}}` + after
      const newPos = currentVar.fullStart + 2 + pastedText.length
      inputElement.setSelectionRange(newPos, newPos)
      inputElement.dispatchEvent(new Event("input", { bubbles: true }))
      inputElement.dispatchEvent(new Event("change", { bubbles: true }))
      return true
    }
  } else {
    // Contenteditable fallback paste
    const text = getGeminiInputText(inputElement)
    const vars = TemplateHighlighter.findVariablesInText(text)
    const selection = getInputSelectionOffsets(inputElement)
    if (selection) {
      const currentVar = vars.find(
        (v) =>
          (selection.start >= v.fullStart && selection.start <= v.fullEnd) ||
          (selection.end >= v.fullStart && selection.end <= v.fullEnd)
      )

      if (currentVar && !modifiedVariableIndices.has(currentVar.index)) {
        event.preventDefault()
        event.stopPropagation()
        modifiedVariableIndices.add(currentVar.index)
        const before = text.slice(0, currentVar.fullStart)
        const after = text.slice(currentVar.fullEnd)
        const newText = before + `{{${pastedText}}}` + after
        const paragraph = inputElement.querySelector("p")
        const targetContainer = paragraph ?? inputElement
        targetContainer.textContent = newText
        const newPos = currentVar.fullStart + 2 + pastedText.length
        setCollapsedInputCursor(inputElement, newPos)
        dispatchInputEvent(inputElement, pastedText)
        return true
      }
    }
  }

  return false
}

/**
 * Handles keyboard navigation (ArrowLeft, ArrowRight, Tab, Shift+Tab),
 * automatic erasure of placeholder names on typing,
 * and bracket stripping when Enter (plain, Cmd+Enter, or Ctrl+Enter) is pressed to submit.
 */
export function handleGeminiTemplateKeyDown(event: KeyboardEvent): boolean {
  const target = event.target
  if (!(target instanceof HTMLElement)) return false

  const inputElement =
    findGeminiInput(target) ??
    target.closest<HTMLElement>(GEMINI_INPUT_SELECTOR)
  if (!inputElement) return false

  const text = getGeminiInputText(inputElement)
  if (!hasTemplateVariables(text)) return false

  // 1. Enter key: submit prompt and clean brackets
  if (event.key === "Enter" && !event.shiftKey && !event.altKey) {
    cleanTemplateBracketsInInput(inputElement)
    // Do not prevent default: allow Gemini native message submission!
    return false
  }

  // 2. Typing inside unmodified template variable: erase placeholder name immediately!
  const isPrintable =
    event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey
  const isBackspaceOrDelete =
    event.key === "Backspace" || event.key === "Delete"

  if (isPrintable || isBackspaceOrDelete) {
    if (
      handleTemplateVariableTyping(
        inputElement,
        event,
        isPrintable,
        isBackspaceOrDelete
      )
    ) {
      return true
    }
  }

  // 3. Navigation keys (ArrowLeft, ArrowRight, Tab)
  if (
    event.key !== "ArrowRight" &&
    event.key !== "ArrowLeft" &&
    event.key !== "Tab"
  ) {
    return false
  }

  const vars = TemplateHighlighter.findVariablesInText(text)
  if (vars.length === 0) return false

  const selection = getInputSelectionOffsets(inputElement)
  if (!selection) return false

  const isBackwards =
    event.key === "ArrowLeft" || (event.key === "Tab" && event.shiftKey)

  let shouldJump = false

  if (event.key === "Tab") {
    shouldJump = true
  } else if (event.altKey || event.ctrlKey || event.metaKey) {
    shouldJump = true
  } else {
    // Arrow keys without modifiers
    const currentVar = vars.find(
      (v) =>
        (selection.start >= v.fullStart && selection.start <= v.fullEnd) ||
        (selection.end >= v.fullStart && selection.end <= v.fullEnd) ||
        (selection.start <= v.fullStart && selection.end >= v.fullEnd)
    )

    if (currentVar) {
      const isUnmodified = !isVariableModified(inputElement, currentVar)
      if (isUnmodified) {
        shouldJump = true
      } else {
        if (!isBackwards && selection.end >= currentVar.innerEnd) {
          shouldJump = true
        } else if (isBackwards && selection.start <= currentVar.innerStart) {
          shouldJump = true
        }
      }
    }
  }

  if (shouldJump) {
    event.preventDefault()
    event.stopPropagation()
    jumpToNextTemplateVariable(inputElement, isBackwards)
    return true
  }

  return false
}
