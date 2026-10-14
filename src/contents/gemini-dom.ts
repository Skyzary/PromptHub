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

export const PROMPTHUB_TEMPLATE_STYLE_ID = "prompthub-template-variable-styles"

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
