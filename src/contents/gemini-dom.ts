import {
  TemplateHighlighter,
  type TemplateVariableLocation
} from "./TemplateHighlighter"

export * from "./gemini-elements"
export * from "./gemini-position"
export * from "./gemini-selection"
export * from "./gemini-template-state"
export * from "./gemini-input-sync"
export * from "./gemini-event-handlers"
export * from "./TemplateHighlighter"

// Explicit named re-exports for bundlers (like Parcel / Plasmo) that struggle with barrel re-exports:
export {
  computeGeminiPopoverPosition,
  POPOVER_OFFSET_PX,
  POPOVER_ESTIMATED_HEIGHT_PX,
  POPOVER_WIDTH_PX,
  VIEWPORT_MARGIN_PX,
  type GeminiPopoverPosition
} from "./gemini-position"

export {
  handleGeminiSendTrigger,
  handleTemplateVariableTyping,
  handleGeminiTemplatePaste,
  handleGeminiTemplateKeyDown
} from "./gemini-event-handlers"

export {
  findGeminiInput,
  findGeminiInputContainer,
  findAllGeminiInputs,
  isGeminiInputElement,
  isGeminiInputContainer,
  isGeminiSendButton,
  findGeminiSendButton,
  detectGeminiPageTheme,
  getOrCreateGeminiRootContainer,
  isGeminiRootContainer,
  GEMINI_INPUT_SELECTOR,
  GEMINI_INPUT_SELECTORS,
  GEMINI_CONTAINER_SELECTOR,
  GEMINI_CONTAINER_SELECTORS,
  TEMPLAGEM_GEMINI_ROOT_ID
} from "./gemini-elements"

export {
  dispatchInputEvent,
  cleanTemplateBracketsInInput,
  insertTextIntoGeminiInput
} from "./gemini-input-sync"

export {
  getGeminiInputText,
  getInputSelectionOffsets,
  setCollapsedInputCursor
} from "./gemini-selection"

export {
  jumpToNextTemplateVariable,
  highlightActiveVariableElement,
  resetModifiedTemplateVariables,
  isVariableModified,
  modifiedVariableIndices
} from "./gemini-template-state"

export const TEMPLAGEM_TEMPLATE_STYLE_ID = "templagem-template-variable-styles"

/**
 * Applies template variable highlight classes instead of injecting dynamic <style> tags.
 */
export function injectTemplateVariableStyles(
  element?: HTMLElement | HTMLTextAreaElement | null
): void {
  TemplateHighlighter.applyHighlightClasses(element)
}

/**
 * Finds all {{variable}} positions in a given text string.
 */
export function findTemplateVariablesInText(
  text: string
): TemplateVariableLocation[] {
  return TemplateHighlighter.findVariablesInText(text)
}

/**
 * Builds HTML string where all {{variable}} expressions are wrapped in styled spans.
 */
export function buildTemplateHtml(text: string): string {
  return TemplateHighlighter.buildTemplateHtml(text)
}
