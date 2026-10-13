import {
  hasTemplateVariables,
  stripTemplateBrackets
} from "../utils/template"
import type { ThemeMode } from "../utils/theme"

export const GEMINI_INPUT_SELECTORS = [
  '.ql-editor[contenteditable="true"]',
  'rich-textarea [contenteditable="true"]',
  'div[role="textbox"][contenteditable="true"]',
  "textarea"
] as const

export const GEMINI_INPUT_SELECTOR = GEMINI_INPUT_SELECTORS.join(", ")

export const PROMPTHUB_GEMINI_ROOT_ID = "prompthub-gemini-root"

export const POPOVER_OFFSET_PX = 12
export const POPOVER_ESTIMATED_HEIGHT_PX = 340
export const POPOVER_WIDTH_PX = 360
export const VIEWPORT_MARGIN_PX = 12

/**
 * Returns the Gemini-specific root container for mounting UI overlays.
 */
export function getOrCreateGeminiRootContainer(): HTMLElement {
  const existing = document.getElementById(PROMPTHUB_GEMINI_ROOT_ID)
  if (existing) {
    return existing
  }
  const container = document.createElement("div")
  container.id = PROMPTHUB_GEMINI_ROOT_ID
  document.body.appendChild(container)
  return container
}

/**
 * Finds the editable Gemini input element from an event target.
 * Ignores clicks inside the PromptHub popover itself.
 */
export function findGeminiInput(
  target: EventTarget | null,
  excludeElement: HTMLElement | null = null
): HTMLElement | null {
  if (!(target instanceof HTMLElement)) {
    return null
  }
  if (excludeElement && excludeElement.contains(target)) {
    return null
  }
  return target.closest<HTMLElement>(GEMINI_INPUT_SELECTOR)
}

/**
 * Computes top and left coordinates for positioning the popover
 * adjacent to the active input element, flipping above/below based on viewport space.
 */
export function computeGeminiPopoverPosition(rect: DOMRect): {
  top: number
  left: number
} {
  const viewportWidth =
    typeof window !== "undefined" && window.innerWidth > 0
      ? window.innerWidth
      : 1024

  const placeAbove =
    rect.top >= POPOVER_ESTIMATED_HEIGHT_PX + VIEWPORT_MARGIN_PX
  const top = placeAbove
    ? Math.max(
        VIEWPORT_MARGIN_PX,
        rect.top - POPOVER_ESTIMATED_HEIGHT_PX - POPOVER_OFFSET_PX
      )
    : Math.max(VIEWPORT_MARGIN_PX, rect.bottom + POPOVER_OFFSET_PX)

  const maxLeft = Math.max(
    VIEWPORT_MARGIN_PX,
    viewportWidth - POPOVER_WIDTH_PX - VIEWPORT_MARGIN_PX
  )
  const left = Math.min(Math.max(VIEWPORT_MARGIN_PX, rect.left), maxLeft)

  return { top, left }
}

export const PROMPTHUB_TEMPLATE_STYLE_ID = "prompthub-template-variable-styles"

/**
 * Injects stylesheet for highlighting template variables in blue across Gemini DOM.
 */
export function injectTemplateVariableStyles(): void {
  if (typeof document === "undefined") return
  if (document.getElementById(PROMPTHUB_TEMPLATE_STYLE_ID)) return

  const style = document.createElement("style")
  style.id = PROMPTHUB_TEMPLATE_STYLE_ID
  style.textContent = `
    .ph-template-variable {
      color: #2563eb !important;
      background-color: rgba(37, 99, 235, 0.12) !important;
      border: 1px solid rgba(37, 99, 235, 0.25) !important;
      border-radius: 4px !important;
      padding: 0 4px !important;
      font-weight: 600 !important;
      display: inline !important;
      transition: background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease !important;
    }
    .ph-template-variable-active {
      color: #1d4ed8 !important;
      background-color: rgba(37, 99, 235, 0.26) !important;
      border-color: #2563eb !important;
      box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.38) !important;
    }
    [data-theme="dark"] .ph-template-variable,
    body.dark-theme .ph-template-variable,
    html[data-theme="dark"] .ph-template-variable,
    html.dark .ph-template-variable {
      color: #60a5fa !important;
      background-color: rgba(59, 130, 246, 0.2) !important;
      border-color: rgba(59, 130, 246, 0.35) !important;
    }
    [data-theme="dark"] .ph-template-variable-active,
    body.dark-theme .ph-template-variable-active,
    html[data-theme="dark"] .ph-template-variable-active,
    html.dark .ph-template-variable-active {
      color: #93c5fd !important;
      background-color: rgba(59, 130, 246, 0.36) !important;
      border-color: #60a5fa !important;
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.48) !important;
    }
  `
  document.head.appendChild(style)
}

export interface TemplateVariableLocation {
  index: number
  name: string
  raw: string
  fullStart: number
  fullEnd: number
  innerStart: number
  innerEnd: number
}

/**
 * Finds all {{variable}} positions in a given text string.
 */
export function findTemplateVariablesInText(
  text: string
): TemplateVariableLocation[] {
  const regex = /\{\{\s*([^}]+?)\s*\}\}/g
  const results: TemplateVariableLocation[] = []
  let match: RegExpExecArray | null
  let idx = 0

  while ((match = regex.exec(text)) !== null) {
    const raw = match[0]
    const name = (match[1] ?? "").trim()
    const fullStart = match.index
    const fullEnd = fullStart + raw.length
    const innerStart = fullStart + raw.indexOf(name)
    const innerEnd = innerStart + name.length

    results.push({
      index: idx++,
      name,
      raw,
      fullStart,
      fullEnd,
      innerStart,
      innerEnd
    })
  }

  return results
}

/**
 * Extracts plain text from either textarea/input or contenteditable element.
 */
export function getGeminiInputText(element: HTMLElement): string {
  if (
    element instanceof HTMLTextAreaElement ||
    element instanceof HTMLInputElement
  ) {
    return element.value
  }
  return element.textContent ?? ""
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

/**
 * Builds HTML string where all {{variable}} expressions are wrapped in blue styled spans.
 */
export function buildTemplateHtml(text: string): string {
  const regex = /\{\{\s*([^}]+?)\s*\}\}/g
  let lastIndex = 0
  let html = ""
  let varIdx = 0

  let match: RegExpExecArray | null
  while ((match = regex.exec(text)) !== null) {
    const start = match.index
    const raw = match[0]
    const varName = (match[1] ?? "").trim()

    if (start > lastIndex) {
      html += escapeHtml(text.slice(lastIndex, start))
    }

    html += `<span class="ph-template-variable" data-ph-var="${escapeHtml(varName)}" data-ph-original="${escapeHtml(varName)}" data-ph-index="${varIdx++}" style="color: #2563eb; background-color: rgba(37, 99, 235, 0.12); border-radius: 4px; padding: 0 4px; font-weight: 600;">${escapeHtml(raw)}</span>`
    lastIndex = start + raw.length
  }

  if (lastIndex < text.length) {
    html += escapeHtml(text.slice(lastIndex))
  }

  return html
}

/**
 * Retrieves character offsets of selection inside a contenteditable element.
 */
export function getContentEditableSelectionOffsets(
  element: HTMLElement
): { start: number; end: number } | null {
  if (typeof window === "undefined") return null
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) return null

  const range = selection.getRangeAt(0)
  if (
    !element.contains(range.startContainer) ||
    !element.contains(range.endContainer)
  ) {
    return null
  }

  let start = 0
  let end = 0
  let currentPos = 0

  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT,
    null
  )

  let node: Node | null = walker.nextNode()
  let foundStart = false
  let foundEnd = false

  while (node) {
    const textLen = node.textContent?.length ?? 0

    if (!foundStart && node === range.startContainer) {
      start = currentPos + range.startOffset
      foundStart = true
    }

    if (!foundEnd && node === range.endContainer) {
      end = currentPos + range.endOffset
      foundEnd = true
    }

    if (foundStart && foundEnd) {
      break
    }

    currentPos += textLen
    node = walker.nextNode()
  }

  if (!foundStart || !foundEnd) {
    return null
  }

  return { start, end }
}

/**
 * Sets DOM selection range inside a contenteditable element based on character offsets.
 */
export function setContentEditableSelection(
  element: HTMLElement,
  start: number,
  end: number
): boolean {
  if (typeof window === "undefined") return false
  const selection = window.getSelection()
  if (!selection || typeof document.createRange !== "function") return false

  let currentPos = 0
  let startNode: Node | null = null
  let startNodeOffset = 0
  let endNode: Node | null = null
  let endNodeOffset = 0

  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT,
    null
  )

  let node: Node | null = walker.nextNode()
  while (node) {
    const textLen = node.textContent?.length ?? 0
    if (!startNode && currentPos + textLen >= start) {
      startNode = node
      startNodeOffset = Math.max(0, start - currentPos)
    }
    if (!endNode && currentPos + textLen >= end) {
      endNode = node
      endNodeOffset = Math.min(textLen, end - currentPos)
      break
    }
    currentPos += textLen
    node = walker.nextNode()
  }

  if (startNode && !endNode && node === null) {
    const lastNode = walker.currentNode
    if (lastNode && lastNode.textContent) {
      endNode = lastNode
      endNodeOffset = lastNode.textContent.length
    }
  }

  if (startNode && endNode) {
    try {
      const range = document.createRange()
      range.setStart(startNode, startNodeOffset)
      range.setEnd(endNode, endNodeOffset)
      selection.removeAllRanges()
      selection.addRange(range)
      return true
    } catch {
      return false
    }
  }

  return false
}

/**
 * Returns character offsets of current selection inside the input element.
 */
export function getInputSelectionOffsets(
  element: HTMLElement
): { start: number; end: number } | null {
  if (
    element instanceof HTMLTextAreaElement ||
    element instanceof HTMLInputElement
  ) {
    return {
      start: element.selectionStart ?? 0,
      end: element.selectionEnd ?? 0
    }
  }
  return getContentEditableSelectionOffsets(element)
}

/**
 * Sets selection range in either textarea/input or contenteditable input element.
 */
export function setInputSelectionRange(
  element: HTMLElement,
  start: number,
  end: number
): boolean {
  element.focus()
  if (
    element instanceof HTMLTextAreaElement ||
    element instanceof HTMLInputElement
  ) {
    element.setSelectionRange(start, end)
    return true
  }
  return setContentEditableSelection(element, start, end)
}

/**
 * Sets a collapsed caret position inside an input or contenteditable element.
 * Guarantees NO standard text selection (no blue selection box) is applied.
 */
export function setCollapsedInputCursor(
  element: HTMLElement,
  position: number
): boolean {
  element.focus()
  if (
    element instanceof HTMLTextAreaElement ||
    element instanceof HTMLInputElement
  ) {
    element.setSelectionRange(position, position)
    return true
  }
  return setContentEditableSelection(element, position, position)
}

/**
 * Highlights the active template variable element visually with .ph-template-variable-active
 * while removing it from other variable elements.
 */
export function highlightActiveVariableElement(
  container: HTMLElement,
  activeIdx: number
): void {
  const spans = container.querySelectorAll<HTMLElement>(".ph-template-variable")
  spans.forEach((span, i) => {
    if (i === activeIdx) {
      span.classList.add("ph-template-variable-active")
    } else {
      span.classList.remove("ph-template-variable-active")
    }
  })
}

/**
 * Jumps to the next or previous template variable in the input element.
 * Positions a collapsed cursor inside the variable (NO standard text selection)
 * and highlights the active variable with .ph-template-variable-active.
 */
export function jumpToNextTemplateVariable(
  element: HTMLElement,
  backwards: boolean = false
): boolean {
  const text = getGeminiInputText(element)
  const vars = findTemplateVariablesInText(text)
  if (vars.length === 0) return false

  const selection = getInputSelectionOffsets(element)
  if (!selection) {
    const targetIdx = backwards ? vars.length - 1 : 0
    const target = vars[targetIdx]
    const caretPos = backwards ? target.innerStart : target.innerEnd
    setCollapsedInputCursor(element, caretPos)
    highlightActiveVariableElement(element, targetIdx)
    return true
  }

  let currentIdx = -1
  for (let i = 0; i < vars.length; i++) {
    const v = vars[i]
    if (
      (selection.start >= v.fullStart && selection.start <= v.fullEnd) ||
      (selection.end >= v.fullStart && selection.end <= v.fullEnd) ||
      (selection.start <= v.fullStart && selection.end >= v.fullEnd)
    ) {
      currentIdx = i
      break
    }
  }

  let nextIdx: number
  if (currentIdx !== -1) {
    if (backwards) {
      nextIdx = currentIdx > 0 ? currentIdx - 1 : vars.length - 1
    } else {
      nextIdx = currentIdx < vars.length - 1 ? currentIdx + 1 : 0
    }
  } else {
    if (backwards) {
      const prevVars = vars.filter((v) => v.fullEnd <= selection.start)
      nextIdx =
        prevVars.length > 0
          ? vars.indexOf(prevVars[prevVars.length - 1])
          : vars.length - 1
    } else {
      const nextVars = vars.filter((v) => v.fullStart >= selection.end)
      nextIdx = nextVars.length > 0 ? vars.indexOf(nextVars[0]) : 0
    }
  }

  const target = vars[nextIdx]
  if (target) {
    const caretPos = backwards ? target.innerStart : target.innerEnd
    setCollapsedInputCursor(element, caretPos)
    highlightActiveVariableElement(element, nextIdx)
    return true
  }

  return false
}

/**
 * Strips {{ and }} from template variables in the input element upon submission,
 * leaving only the substituted contents. Synchronously updates Quill delta,
 * contenteditable text, and textarea values so Gemini sends clean text.
 */
export function cleanTemplateBracketsInInput(element: HTMLElement): boolean {
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
}

/**
 * Checks if the target element corresponds to Gemini's Send / Submit button.
 * Supports English and Russian interfaces, Angular Material buttons, SVG icons, and custom classes.
 */
export function isGeminiSendButton(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false

  const btn = target.closest<HTMLElement>(
    'button, [role="button"], .send-button'
  )
  if (!btn) return false

  // Ignore PromptHub's own buttons
  if (btn.closest(`#${PROMPTHUB_GEMINI_ROOT_ID}`)) return false

  const ariaLabel = (btn.getAttribute("aria-label") ?? "").toLowerCase()
  const matTooltip = (btn.getAttribute("mattooltip") ?? "").toLowerCase()
  const dataTooltip = (btn.getAttribute("data-tooltip") ?? "").toLowerCase()
  const title = (btn.getAttribute("title") ?? "").toLowerCase()
  const testId = (btn.getAttribute("data-testid") ?? "").toLowerCase()
  const cls = (
    typeof btn.className === "string"
      ? btn.className
      : btn.getAttribute("class") ?? ""
  ).toLowerCase()

  // Exclude microphone, voice, audio, and upload/attachment buttons
  const isExcluded =
    ariaLabel.includes("mic") ||
    ariaLabel.includes("микрофон") ||
    ariaLabel.includes("voice") ||
    ariaLabel.includes("голос") ||
    ariaLabel.includes("upload") ||
    ariaLabel.includes("загруз") ||
    ariaLabel.includes("file") ||
    ariaLabel.includes("файл") ||
    ariaLabel.includes("attach") ||
    ariaLabel.includes("прикреп")

  if (isExcluded) return false

  // Match send keywords in English and Russian ("отправ" covers отправить, отправка, отправить запрос)
  if (
    ariaLabel.includes("send") ||
    ariaLabel.includes("отправ") ||
    ariaLabel.includes("submit") ||
    matTooltip.includes("send") ||
    matTooltip.includes("отправ") ||
    dataTooltip.includes("send") ||
    dataTooltip.includes("отправ") ||
    title.includes("send") ||
    title.includes("отправ") ||
    testId.includes("send") ||
    cls.includes("send")
  ) {
    return true
  }

  // Detect send / upward-arrow icon in chat input area
  const hasSendIcon =
    Boolean(
      btn.querySelector(
        'svg, mat-icon, [data-icon="send"], i.google-material-icons'
      )
    ) ||
    btn.innerHTML.includes("send") ||
    btn.innerHTML.includes("arrow_upward")

  const isInInputArea = Boolean(
    btn.closest(
      'rich-textarea, .input-area, .chat-input, .text-input-field, form, main, footer'
    )
  )

  if (hasSendIcon && isInInputArea) {
    return true
  }

  return false
}

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
      const inputs = document.querySelectorAll<HTMLElement>(GEMINI_INPUT_SELECTOR)
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

export const modifiedVariableIndices = new Set<number>()

/**
 * Resets the set of modified template variables.
 */
export function resetModifiedTemplateVariables(): void {
  modifiedVariableIndices.clear()
}

/**
 * Helper to dispatch an input event and change event on an input element.
 */
export function dispatchInputEvent(element: HTMLElement, data: string): void {
  const inputEvent =
    typeof InputEvent === "function"
      ? new InputEvent("input", {
          bubbles: true,
          cancelable: true,
          data,
          inputType: "insertText"
        })
      : new Event("input", { bubbles: true })

  element.dispatchEvent(inputEvent)
  element.dispatchEvent(new Event("change", { bubbles: true }))
}

/**
 * Checks whether a template variable has already been modified by the user.
 */
export function isVariableModified(
  container: HTMLElement,
  v: TemplateVariableLocation
): boolean {
  if (modifiedVariableIndices.has(v.index)) {
    return true
  }

  const spans = container.querySelectorAll<HTMLElement>(".ph-template-variable")
  const span = spans[v.index]
  if (span && span.getAttribute("data-ph-modified") === "true") {
    return true
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
      const span =
        node instanceof Element
          ? node.closest<HTMLElement>(".ph-template-variable")
          : node.parentElement?.closest<HTMLElement>(".ph-template-variable")

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
  const vars = findTemplateVariablesInText(text)
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
          ? node.closest<HTMLElement>(".ph-template-variable")
          : node.parentElement?.closest<HTMLElement>(".ph-template-variable")

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
    const vars = findTemplateVariablesInText(text)
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

  const inputElement = target.closest<HTMLElement>(GEMINI_INPUT_SELECTOR)
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
    event.key.length === 1 &&
    !event.ctrlKey &&
    !event.metaKey &&
    !event.altKey
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

  const vars = findTemplateVariablesInText(text)
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
  resetModifiedTemplateVariables()
  injectTemplateVariableStyles()
  element.focus()

  const vars = findTemplateVariablesInText(text)
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

  const paragraph = element.querySelector("p")
  if (hasVars) {
    const html = buildTemplateHtml(text)
    if (paragraph) {
      paragraph.innerHTML = html
    } else {
      element.innerHTML = html
    }
  } else {
    if (paragraph) {
      paragraph.textContent = text
    } else {
      element.textContent = text
    }
  }

  const inputEvent =
    typeof InputEvent === "function"
      ? new InputEvent("input", {
          bubbles: true,
          cancelable: true,
          data: text,
          inputType: "insertText"
        })
      : new Event("input", { bubbles: true })

  element.dispatchEvent(inputEvent)

  if (hasVars) {
    setCollapsedInputCursor(element, vars[0].innerEnd)
    highlightActiveVariableElement(element, 0)
  }
}

/**
 * Detects whether the current Gemini page is rendered in dark mode
 * by checking body classes, data attributes, or media queries.
 */
export function detectGeminiPageTheme(): ThemeMode {
  if (typeof document !== "undefined") {
    if (
      document.body?.classList.contains("dark-theme") ||
      document.documentElement?.getAttribute("data-theme") === "dark" ||
      document.documentElement?.classList.contains("dark")
    ) {
      return "dark"
    }
  }
  if (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    return "dark"
  }
  return "light"
}
