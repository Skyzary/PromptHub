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
 * Class managing template variable parsing, HTML generation, and active element highlighting.
 * Replaces dynamic <style> injection with clean CSS classes and DOM class application.
 */
export class TemplateHighlighter {
  public static readonly VARIABLE_CLASS = "ph-template-variable"
  public static readonly ACTIVE_CLASS = "ph-template-variable-active"
  public static readonly CONTAINER_CLASS = "ph-template-container"
  public static readonly ROOT_CLASS = "ph-templates-enabled"

  /**
   * Applies highlight container and root classes instead of dynamic <style> injection.
   */
  public static applyHighlightClasses(
    element?: HTMLElement | HTMLTextAreaElement | null
  ): void {
    if (element && "classList" in element) {
      element.classList.add(TemplateHighlighter.CONTAINER_CLASS)
    }
    if (typeof document !== "undefined" && document.body) {
      document.body.classList.add(TemplateHighlighter.ROOT_CLASS)
    }
  }

  /**
   * Removes highlight container classes from an element.
   */
  public static removeHighlightClasses(
    element?: HTMLElement | HTMLTextAreaElement | null
  ): void {
    if (element && "classList" in element) {
      element.classList.remove(TemplateHighlighter.CONTAINER_CLASS)
    }
  }

  /**
   * Finds all {{variable}} positions in a given text string.
   */
  public static findVariablesInText(text: string): TemplateVariableLocation[] {
    const regex = /\{\{\s*([^}]+?)\s*\}\}/g
    const results: TemplateVariableLocation[] = []
    let match: RegExpExecArray | null
    let idx = 0

    while ((match = regex.exec(text)) !== null) {
      const fullStart = match.index
      const fullEnd = fullStart + match[0].length
      const raw = match[0]
      const captured = match[1] ?? ""
      const name = captured.trim()
      const openLen = raw.indexOf(captured)
      const innerStart = fullStart + (openLen >= 0 ? openLen : 2)
      const innerEnd = innerStart + captured.length

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
   * Builds HTML string where all {{variable}} expressions are wrapped in spans
   * with the template variable CSS class (no inline styles).
   */
  public static buildTemplateHtml(text: string): string {
    const regex = /\{\{\s*([^}]+?)\s*\}\}/g
    let lastIndex = 0
    let html = ""
    let varIdx = 0

    let match: RegExpExecArray | null
    while ((match = regex.exec(text)) !== null) {
      const start = match.index
      const raw = match[0]
      const captured = match[1] ?? ""
      const varName = captured.trim()

      if (start > lastIndex) {
        html += TemplateHighlighter.escapeHtml(text.slice(lastIndex, start))
      }

      html += `<span class="${TemplateHighlighter.VARIABLE_CLASS}" data-ph-var="${TemplateHighlighter.escapeHtml(varName)}" data-ph-original="${TemplateHighlighter.escapeHtml(varName)}" data-ph-index="${varIdx++}">${TemplateHighlighter.escapeHtml(raw)}</span>`
      lastIndex = start + raw.length
    }

    if (lastIndex < text.length) {
      html += TemplateHighlighter.escapeHtml(text.slice(lastIndex))
    }

    return html
  }

  /**
   * Highlights the active template variable element visually with ACTIVE_CLASS
   * while removing it from other variable elements.
   */
  public static highlightActive(
    container: HTMLElement,
    activeIdx: number
  ): void {
    const spans = container.querySelectorAll<HTMLElement>(
      `.${TemplateHighlighter.VARIABLE_CLASS}`
    )
    spans.forEach((span, i) => {
      if (i === activeIdx) {
        span.classList.add(TemplateHighlighter.ACTIVE_CLASS)
      } else {
        span.classList.remove(TemplateHighlighter.ACTIVE_CLASS)
      }
    })
  }

  /**
   * Escapes HTML special characters.
   */
  public static escapeHtml(str: string): string {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
  }
}
