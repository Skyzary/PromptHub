import { useEffect, useRef, type MutableRefObject, type RefObject } from "react"

import type { IPrompt } from "../../types"
import { hasTemplateVariables } from "../../utils/template"
import { findGeminiInput } from "../gemini-elements"
import {
  handleGeminiSendTrigger,
  handleGeminiTemplateKeyDown,
  handleGeminiTemplatePaste
} from "../gemini-event-handlers"
import { isProgrammaticInsert } from "../gemini-input-sync"
import { getGeminiInputText } from "../gemini-selection"

export interface UseGeminiOverlayEventsOptions {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  popoverRef: RefObject<HTMLElement | null>
  activeInputRef: MutableRefObject<HTMLElement | null>
  filteredPromptsRef: MutableRefObject<IPrompt[]>
  selectedIndexRef: MutableRefObject<number>
  setSelectedIndex: React.Dispatch<React.SetStateAction<number>>
  handleSelectPrompt: (prompt: IPrompt) => void
  updatePositionForTarget: (target: EventTarget | null) => boolean
}

export function useGeminiOverlayEvents({
  isOpen,
  setIsOpen,
  popoverRef,
  activeInputRef,
  filteredPromptsRef,
  selectedIndexRef,
  setSelectedIndex,
  handleSelectPrompt,
  updatePositionForTarget
}: UseGeminiOverlayEventsOptions) {
  const isDismissedRef = useRef(false)

  useEffect(() => {
    const isTargetInsidePopover = (
      target: Node | null,
      event?: Event
    ): boolean => {
      if (!popoverRef.current) return false
      if (target && popoverRef.current.contains(target)) return true
      if (event && typeof event.composedPath === "function") {
        return event.composedPath().includes(popoverRef.current)
      }
      return false
    }

    const openForTarget = (target: EventTarget | null) => {
      if (isDismissedRef.current) {
        return
      }

      const input =
        activeInputRef.current ??
        (target instanceof HTMLElement ? findGeminiInput(target) : null)
      if (input && hasTemplateVariables(getGeminiInputText(input))) {
        return
      }

      const opened = updatePositionForTarget(target)
      if (opened) {
        setIsOpen(true)
      }
    }

    const handleFocusIn = (event: FocusEvent) => {
      // Do not re-open if the popover was dismissed while typing/editing
      if (isDismissedRef.current) {
        return
      }

      const target = event.target as Node | null
      const relatedTarget = event.relatedTarget as Node | null

      // Ignore focus events when moving between nodes inside the active input
      if (
        activeInputRef.current &&
        relatedTarget &&
        activeInputRef.current.contains(relatedTarget)
      ) {
        return
      }

      // Ignore if the active input is already the activeElement and the target is inside it
      if (
        activeInputRef.current &&
        target &&
        activeInputRef.current.contains(target) &&
        (document.activeElement === activeInputRef.current ||
          activeInputRef.current.contains(document.activeElement))
      ) {
        return
      }

      const input =
        activeInputRef.current ??
        (target instanceof HTMLElement ? findGeminiInput(target) : null)
      if (input && hasTemplateVariables(getGeminiInputText(input))) {
        return
      }

      openForTarget(event.target)
    }

    const handleFocusOut = (event: FocusEvent) => {
      const relatedTarget = event.relatedTarget as Node | null
      // Reset dismissal flag only when focus completely leaves the active input element
      if (
        activeInputRef.current &&
        (!relatedTarget || !activeInputRef.current.contains(relatedTarget))
      ) {
        const text = getGeminiInputText(activeInputRef.current).trim()
        if (!text) {
          isDismissedRef.current = false
        }
      }
    }

    const handlePointerDown = (event: PointerEvent) => {
      handleGeminiSendTrigger(event, activeInputRef.current)
    }

    const handleClick = (event: MouseEvent) => {
      handleGeminiSendTrigger(event, activeInputRef.current)
      const target = event.target
      if (target instanceof Node && isTargetInsidePopover(target, event)) {
        return
      }

      const input =
        activeInputRef.current ??
        (target instanceof HTMLElement ? findGeminiInput(target) : null)
      if (input && hasTemplateVariables(getGeminiInputText(input))) {
        return
      }

      isDismissedRef.current = false
      openForTarget(event.target)
    }

    const handleMouseDownOutside = (event: MouseEvent) => {
      handleGeminiSendTrigger(event, activeInputRef.current)
      const target = event.target
      if (!(target instanceof Node)) {
        return
      }
      if (isTargetInsidePopover(target, event)) {
        return
      }
      if (activeInputRef.current?.contains(target)) {
        return
      }
      isDismissedRef.current = false
      setIsOpen(false)
    }

    const handleSubmit = (event: Event) => {
      handleGeminiSendTrigger(event, activeInputRef.current)
    }

    const dismissOnTyping = () => {
      isDismissedRef.current = true
      setIsOpen(false)
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as Node | null
      const isInsidePopover = isTargetInsidePopover(target, event)
      const input =
        activeInputRef.current ??
        (target instanceof HTMLElement ? findGeminiInput(target) : null)
      const hasVars = input
        ? hasTemplateVariables(getGeminiInputText(input))
        : false

      // If the editor already contains a template with variables, template navigation
      // (Tab, arrows) and variable editing/submission in the editor take absolute precedence!
      if (hasVars && !isInsidePopover) {
        if (handleGeminiTemplateKeyDown(event)) {
          dismissOnTyping()
          return
        }
        if (event.key === "Enter" && !event.shiftKey && !event.altKey) {
          dismissOnTyping()
          return
        }
      }

      if (!isOpen) {
        handleGeminiTemplateKeyDown(event)
        return
      }

      if (event.key === "Escape") {
        event.preventDefault()
        event.stopPropagation()
        isDismissedRef.current = true
        setIsOpen(false)
        return
      }

      const isGeminiInputTarget =
        target === activeInputRef.current ||
        (target instanceof HTMLElement && Boolean(findGeminiInput(target)))

      if (
        isInsidePopover ||
        isGeminiInputTarget ||
        !target ||
        target === document.body
      ) {
        if (event.key === "ArrowDown") {
          event.preventDefault()
          event.stopPropagation()
          setSelectedIndex((prev) => {
            const count = Math.max(1, filteredPromptsRef.current.length)
            const next = (prev + 1) % count
            selectedIndexRef.current = next
            return next
          })
          return
        }

        if (event.key === "ArrowUp") {
          event.preventDefault()
          event.stopPropagation()
          setSelectedIndex((prev) => {
            const count = Math.max(1, filteredPromptsRef.current.length)
            const next = (prev - 1 + count) % count
            selectedIndexRef.current = next
            return next
          })
          return
        }

        if (
          (event.key === "Enter" &&
            !event.shiftKey &&
            !event.ctrlKey &&
            !event.metaKey &&
            !event.altKey) ||
          event.key === "Tab"
        ) {
          const list = filteredPromptsRef.current
          const currentIdx = selectedIndexRef.current
          if (list.length > 0 && currentIdx >= 0 && currentIdx < list.length) {
            event.preventDefault()
            event.stopPropagation()
            isDismissedRef.current = true
            setIsOpen(false)
            handleSelectPrompt(list[currentIdx])
            return
          }
          if (event.key === "Enter" && !isInsidePopover) {
            dismissOnTyping()
          }
        }
      }

      // First priority: handle template navigation or variable typing
      if (handleGeminiTemplateKeyDown(event)) {
        dismissOnTyping()
        return
      }

      // If the user starts typing outside the popover,
      // close the popover window so it doesn't obstruct typing.
      if (!isInsidePopover) {
        const isPrintable =
          event.key.length === 1 &&
          !event.ctrlKey &&
          !event.metaKey &&
          !event.altKey
        const isDeleteOrBackspace =
          event.key === "Backspace" || event.key === "Delete"
        const isImeComposing = event.isComposing || event.key === "Process"

        if (isPrintable || isDeleteOrBackspace || isImeComposing) {
          dismissOnTyping()
        }
      }
    }

    const handlePaste = (event: ClipboardEvent) => {
      const target = event.target as Node | null
      if (!isTargetInsidePopover(target, event)) {
        dismissOnTyping()
      }
      handleGeminiTemplatePaste(event)
    }

    const handleInput = (event: Event) => {
      if (isProgrammaticInsert) {
        return
      }
      const target = event.target as Node | null
      if (!isTargetInsidePopover(target, event)) {
        const input =
          activeInputRef.current ??
          (target instanceof HTMLElement ? findGeminiInput(target) : null)
        const text = input ? getGeminiInputText(input).trim() : ""
        if (!text) {
          isDismissedRef.current = false
        } else if (hasTemplateVariables(text)) {
          return
        } else {
          dismissOnTyping()
        }
      }
    }

    const handleCompositionStart = (event: CompositionEvent) => {
      if (isProgrammaticInsert) {
        return
      }
      const target = event.target as Node | null
      if (!isTargetInsidePopover(target, event)) {
        dismissOnTyping()
      }
    }

    document.addEventListener("focusin", handleFocusIn, true)
    document.addEventListener("focusout", handleFocusOut, true)
    document.addEventListener("pointerdown", handlePointerDown, true)
    document.addEventListener("mousedown", handleMouseDownOutside, true)
    document.addEventListener("click", handleClick, true)
    document.addEventListener("paste", handlePaste, true)
    document.addEventListener("input", handleInput, true)
    document.addEventListener("compositionstart", handleCompositionStart, true)
    document.addEventListener("submit", handleSubmit, true)
    document.addEventListener("keydown", handleKeyDown, true)

    return () => {
      document.removeEventListener("focusin", handleFocusIn, true)
      document.removeEventListener("focusout", handleFocusOut, true)
      document.removeEventListener("pointerdown", handlePointerDown, true)
      document.removeEventListener("mousedown", handleMouseDownOutside, true)
      document.removeEventListener("click", handleClick, true)
      document.removeEventListener("paste", handlePaste, true)
      document.removeEventListener("input", handleInput, true)
      document.removeEventListener(
        "compositionstart",
        handleCompositionStart,
        true
      )
      document.removeEventListener("submit", handleSubmit, true)
      document.removeEventListener("keydown", handleKeyDown, true)
    }
  }, [isOpen])
}
