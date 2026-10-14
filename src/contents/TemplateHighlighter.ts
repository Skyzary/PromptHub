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

  public static readonly STYLE_ELEMENT_ID = "prompthub-template-variable-styles"

  /**
   * Applies highlight container and root classes and injects global styles into document.head
   * so that light DOM elements (like Gemini Quill editor) receive template variable styling.
   */
  public static applyHighlightClasses(
    element?: HTMLElement | HTMLTextAreaElement | null
  ): void {
    if (element && "classList" in element) {
      element.classList.add(TemplateHighlighter.CONTAINER_CLASS)
    }
    if (typeof document !== "undefined" && document.body) {
      document.body.classList.add(TemplateHighlighter.ROOT_CLASS)

      if (!document.getElementById(TemplateHighlighter.STYLE_ELEMENT_ID)) {
        const style = document.createElement("style")
        style.id = TemplateHighlighter.STYLE_ELEMENT_ID
        style.textContent = `
          .ph-template-container {
            position: relative;
          }
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
   * Appends template content as real DOM Nodes into a target element.
   * Completely avoids `element.innerHTML = ...` to prevent TrustedHTML policy violations
   * on pages like gemini.google.com that enforce Trusted Types.
   */
  public static appendTemplateNodes(target: HTMLElement, text: string): void {
    while (target.firstChild) {
      target.removeChild(target.firstChild)
    }

    const regex = /\{\{\s*([^}]+?)\s*\}\}/g
    let lastIndex = 0
    let varIdx = 0
    let match: RegExpExecArray | null

    while ((match = regex.exec(text)) !== null) {
      const start = match.index
      const raw = match[0]
      const captured = match[1] ?? ""
      const varName = captured.trim()

      if (start > lastIndex) {
        target.appendChild(
          document.createTextNode(text.slice(lastIndex, start))
        )
      }

      const span = document.createElement("span")
      span.className = TemplateHighlighter.VARIABLE_CLASS
      span.setAttribute("data-ph-var", varName)
      span.setAttribute("data-ph-original", varName)
      span.setAttribute("data-ph-index", String(varIdx++))
      span.style.color = "#2563eb"
      span.style.backgroundColor = "rgba(37, 99, 235, 0.15)"
      span.style.borderRadius = "4px"
      span.style.padding = "0 4px"
      span.style.fontWeight = "600"
      span.textContent = raw
      target.appendChild(span)

      lastIndex = start + raw.length
    }

    if (lastIndex < text.length) {
      target.appendChild(document.createTextNode(text.slice(lastIndex)))
    }
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
        span.style.backgroundColor = "rgba(37, 99, 235, 0.28)"
        span.style.outline = "2px solid rgba(37, 99, 235, 0.5)"
      } else {
        span.classList.remove(TemplateHighlighter.ACTIVE_CLASS)
        span.style.backgroundColor = "rgba(37, 99, 235, 0.15)"
        span.style.outline = "none"
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
