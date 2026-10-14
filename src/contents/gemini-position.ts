export const POPOVER_OFFSET_PX = 32
export const POPOVER_ESTIMATED_HEIGHT_PX = 340
export const POPOVER_WIDTH_PX = 360
export const VIEWPORT_MARGIN_PX = 12

export interface GeminiPopoverPosition {
  top: number
  bottom?: number
  left: number
  width: number
  dockedAbove: boolean
}

/**
 * Computes coordinates for docking the popover directly onto Gemini's input bar,
 * matching its width and attaching to its top or bottom boundary.
 */
export function computeGeminiPopoverPosition(
  rect: DOMRect,
  containerRect?: DOMRect | null
): GeminiPopoverPosition {
  const targetRect = containerRect || rect
  const viewportWidth =
    typeof window !== "undefined" && window.innerWidth > 0
      ? window.innerWidth
      : 1024
  const viewportHeight =
    typeof window !== "undefined" && window.innerHeight > 0
      ? window.innerHeight
      : 768

  const placeAbove =
    targetRect.top >= POPOVER_ESTIMATED_HEIGHT_PX + VIEWPORT_MARGIN_PX

  // Compute docked width matching container, clamped to viewport margins
  const width = Math.min(
    Math.max(340, targetRect.width || POPOVER_WIDTH_PX),
    viewportWidth - VIEWPORT_MARGIN_PX * 2
  )

  const maxLeft = Math.max(
    VIEWPORT_MARGIN_PX,
    viewportWidth - width - VIEWPORT_MARGIN_PX
  )
  const left = Math.min(Math.max(VIEWPORT_MARGIN_PX, targetRect.left), maxLeft)

  if (placeAbove) {
    const bottom = Math.max(
      VIEWPORT_MARGIN_PX,
      viewportHeight - targetRect.top + POPOVER_OFFSET_PX
    )
    const top = Math.max(
      VIEWPORT_MARGIN_PX,
      targetRect.top - POPOVER_ESTIMATED_HEIGHT_PX - POPOVER_OFFSET_PX
    )
    return {
      top,
      bottom,
      left,
      width,
      dockedAbove: true
    }
  }

  const top = targetRect.bottom + POPOVER_OFFSET_PX
  return {
    top,
    left,
    width,
    dockedAbove: false
  }
}
