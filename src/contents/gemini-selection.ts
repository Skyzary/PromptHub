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

  try {
    const preStartRange = document.createRange()
    preStartRange.setStart(element, 0)
    preStartRange.setEnd(range.startContainer, range.startOffset)
    const start = preStartRange.toString().length

    const preEndRange = document.createRange()
    preEndRange.setStart(element, 0)
    preEndRange.setEnd(range.endContainer, range.endOffset)
    const end = preEndRange.toString().length

    return { start, end }
  } catch {
    return null
  }
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

  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null)

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
