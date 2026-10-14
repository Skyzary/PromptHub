import { useCallback, useEffect, useRef, useState } from "react"

import { findGeminiInput, findGeminiInputContainer } from "../gemini-elements"
import {
  computeGeminiPopoverPosition,
  type GeminiPopoverPosition
} from "../gemini-position"

export function useGeminiPopoverPosition(
  isOpen: boolean,
  popoverRef: React.RefObject<HTMLElement | null>
) {
  const [position, setPosition] = useState<GeminiPopoverPosition>({
    top: 24,
    left: 24,
    width: 360,
    dockedAbove: true
  })
  const activeInputRef = useRef<HTMLElement | null>(null)

  const updatePositionForTarget = useCallback(
    (target: EventTarget | null): boolean => {
      const matchedInput = findGeminiInput(target, popoverRef.current)
      if (!matchedInput) {
        return false
      }
      activeInputRef.current = matchedInput
      const container = findGeminiInputContainer(matchedInput)
      const containerRect = container ? container.getBoundingClientRect() : null
      setPosition(
        computeGeminiPopoverPosition(
          matchedInput.getBoundingClientRect(),
          containerRect
        )
      )
      return true
    },
    [popoverRef]
  )

  useEffect(() => {
    if (!isOpen) return

    const updatePosition = () => {
      if (!activeInputRef.current) return
      const container = findGeminiInputContainer(activeInputRef.current)
      const containerRect = container ? container.getBoundingClientRect() : null
      setPosition(
        computeGeminiPopoverPosition(
          activeInputRef.current.getBoundingClientRect(),
          containerRect
        )
      )
    }

    window.addEventListener("resize", updatePosition)
    window.addEventListener("scroll", updatePosition, true)
    return () => {
      window.removeEventListener("resize", updatePosition)
      window.removeEventListener("scroll", updatePosition, true)
    }
  }, [isOpen])

  return {
    position,
    setPosition,
    activeInputRef,
    updatePositionForTarget
  }
}
