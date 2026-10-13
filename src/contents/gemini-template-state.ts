import {
  getGeminiInputText,
  getInputSelectionOffsets,
  setCollapsedInputCursor
} from "./gemini-selection"
import {
  TemplateHighlighter,
  type TemplateVariableLocation
} from "./TemplateHighlighter"

export const modifiedVariableIndices = new Set<number>()

/**
 * Resets the set of modified template variables.
 */
export function resetModifiedTemplateVariables(): void {
  modifiedVariableIndices.clear()
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

  const spans = container.querySelectorAll<HTMLElement>(
    `.${TemplateHighlighter.VARIABLE_CLASS}`
  )
  const span = spans[v.index]
  if (span && span.getAttribute("data-ph-modified") === "true") {
    return true
  }

  return false
}

/**
 * Highlights the active template variable element visually with .ph-template-variable-active
 * while removing it from other variable elements.
 */
export function highlightActiveVariableElement(
  container: HTMLElement,
  activeIdx: number
): void {
  TemplateHighlighter.highlightActive(container, activeIdx)
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
  const vars = TemplateHighlighter.findVariablesInText(text)
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
