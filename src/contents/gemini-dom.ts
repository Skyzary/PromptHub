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

/**
 * Inserts prompt text into the Gemini input element (handling both
 * textarea/input and contenteditable Quill editors) and fires the necessary
 * input events so Gemini's reactive state recognizes the change.
 */
export function insertTextIntoGeminiInput(
  element: HTMLElement,
  text: string
): void {
  element.focus()

  if (
    element instanceof HTMLTextAreaElement ||
    element instanceof HTMLInputElement
  ) {
    element.value = text
    element.dispatchEvent(new Event("input", { bubbles: true }))
    element.dispatchEvent(new Event("change", { bubbles: true }))
    return
  }

  const paragraph = element.querySelector("p")
  if (paragraph) {
    paragraph.textContent = text
  } else {
    element.textContent = text
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
