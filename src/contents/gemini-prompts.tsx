import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { PlasmoCSConfig } from "plasmo"
import React, { useEffect, useMemo, useRef, useState } from "react"

import TagFilter from "../components/TagFilter/TagFilter"
import type { IPrompt } from "../types"
import { GeminiHeader } from "./components/GeminiHeader"
import { GeminiPromptList } from "./components/GeminiPromptList"
import { GeminiStateView } from "./components/GeminiStateView"
import { loadPromptsForContentScript } from "./gemini-api"
import {
  cleanTemplateBracketsInInput,
  computeGeminiPopoverPosition,
  handleGeminiSendTrigger,
  handleGeminiTemplateKeyDown,
  handleGeminiTemplatePaste,
  handleTemplateVariableTyping,
  insertTextIntoGeminiInput,
  jumpToNextTemplateVariable,
  type GeminiPopoverPosition
} from "./gemini-dom"
import {
  detectGeminiPageTheme,
  findGeminiInput,
  findGeminiInputContainer,
  GEMINI_INPUT_SELECTOR,
  getOrCreateGeminiRootContainer
} from "./gemini-elements"
import css from "./gemini-prompts.module.scss"
import { useGeminiPromptsQuery } from "./hooks/useGeminiPromptsQuery"
import { useThemeStorage } from "./hooks/useThemeStorage"
import { TemplateHighlighter } from "./TemplateHighlighter"
import "./template-variables.scss"

export const config: PlasmoCSConfig = {
  matches: ["https://gemini.google.com/*"]
}

// Re-export DOM helpers & API for backwards-compatibility with tests
export const getRootContainer = getOrCreateGeminiRootContainer
export const findGeminiInputTarget = findGeminiInput
export const computePopoverPosition = computeGeminiPopoverPosition
export const insertPromptIntoElement = insertTextIntoGeminiInput
export const detectPageTheme = detectGeminiPageTheme
export {
  cleanTemplateBracketsInInput,
  findGeminiInputContainer,
  handleGeminiSendTrigger,
  handleGeminiTemplateKeyDown,
  handleGeminiTemplatePaste,
  handleTemplateVariableTyping,
  jumpToNextTemplateVariable,
  loadPromptsForContentScript,
  useThemeStorage,
  useGeminiPromptsQuery,
  TemplateHighlighter
}

export const createDefaultQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnWindowFocus: false,
        gcTime: 0
      }
    }
  })

export const GeminiPromptsOverlayContent: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [selectedIndex, setSelectedIndex] = useState<number>(0)
  const selectedIndexRef = useRef<number>(selectedIndex)
  selectedIndexRef.current = selectedIndex
  const listRef = useRef<HTMLUListElement | null>(null)

  const [position, setPosition] = useState<GeminiPopoverPosition>({
    top: 24,
    left: 24,
    width: 360,
    dockedAbove: true
  })

  const activeInputRef = useRef<HTMLElement | null>(null)
  const popoverRef = useRef<HTMLDivElement | null>(null)

  // TanStack Query handles fetching, caching, loading, error, and refresh states
  const {
    prompts,
    isLoading,
    isAuthenticated,
    errorMessage,
    theme: apiTheme,
    refreshPrompts
  } = useGeminiPromptsQuery({ enabled: isOpen })

  // Dedicated custom hook for storage-backed theme changes
  const [theme] = useThemeStorage(apiTheme)

  useEffect(() => {
    const openForTarget = (target: EventTarget | null) => {
      const matchedInput = findGeminiInput(target, popoverRef.current)
      if (!matchedInput) {
        return
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
      setIsOpen(true)
    }

    const handleFocusIn = (event: FocusEvent) => {
      openForTarget(event.target)
    }

    const handlePointerDown = (event: PointerEvent) => {
      handleGeminiSendTrigger(event, activeInputRef.current)
    }

    const handleClick = (event: MouseEvent) => {
      handleGeminiSendTrigger(event, activeInputRef.current)
      openForTarget(event.target)
    }

    const handleMouseDownOutside = (event: MouseEvent) => {
      handleGeminiSendTrigger(event, activeInputRef.current)
      const target = event.target
      if (!(target instanceof Node)) {
        return
      }
      if (popoverRef.current?.contains(target)) {
        return
      }
      if (activeInputRef.current?.contains(target)) {
        return
      }
      setIsOpen(false)
    }

    const handleSubmit = (event: Event) => {
      handleGeminiSendTrigger(event, activeInputRef.current)
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) {
        handleGeminiTemplateKeyDown(event)
        return
      }

      if (event.key === "Escape") {
        event.preventDefault()
        event.stopPropagation()
        setIsOpen(false)
        return
      }

      const target = event.target as Node | null
      const isInsidePopover = Boolean(popoverRef.current?.contains(target))
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
            handleSelectPrompt(list[currentIdx])
            return
          }
        }
      }

      if (handleGeminiTemplateKeyDown(event)) {
        return
      }
    }

    const handlePaste = (event: ClipboardEvent) => {
      handleGeminiTemplatePaste(event)
    }

    document.addEventListener("focusin", handleFocusIn, true)
    document.addEventListener("pointerdown", handlePointerDown, true)
    document.addEventListener("mousedown", handleMouseDownOutside, true)
    document.addEventListener("click", handleClick, true)
    document.addEventListener("paste", handlePaste, true)
    document.addEventListener("submit", handleSubmit, true)
    document.addEventListener("keydown", handleKeyDown, true)

    return () => {
      document.removeEventListener("focusin", handleFocusIn, true)
      document.removeEventListener("pointerdown", handlePointerDown, true)
      document.removeEventListener("mousedown", handleMouseDownOutside, true)
      document.removeEventListener("click", handleClick, true)
      document.removeEventListener("paste", handlePaste, true)
      document.removeEventListener("submit", handleSubmit, true)
      document.removeEventListener("keydown", handleKeyDown, true)
    }
  }, [isOpen])

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

  const availableTags = useMemo(() => {
    const set = new Set<string>()
    for (const p of prompts) {
      if (Array.isArray(p.tags)) {
        for (const t of p.tags) {
          const trimmed = t.trim()
          if (trimmed) set.add(trimmed)
        }
      }
    }
    return Array.from(set)
  }, [prompts])

  const filteredPrompts = useMemo(() => {
    const tokens = searchQuery.trim().toLowerCase().split(/\s+/).filter(Boolean)

    return prompts.filter((prompt) => {
      if (selectedTag) {
        const hasTag = (prompt.tags ?? []).some(
          (t) => t.toLowerCase() === selectedTag.toLowerCase()
        )
        if (!hasTag) return false
      }

      if (tokens.length === 0) {
        return true
      }

      const titleLower = prompt.title.toLowerCase()
      const bodyLower = prompt.body.toLowerCase()
      const tagsLower = (prompt.tags ?? []).map((t) => t.toLowerCase())

      return tokens.every((token) => {
        if (token.startsWith("#") && token.length > 1) {
          const tagQuery = token.slice(1)
          return tagsLower.some((tag) => tag.includes(tagQuery))
        }

        return (
          titleLower.includes(token) ||
          bodyLower.includes(token) ||
          tagsLower.some((tag) => tag.includes(token))
        )
      })
    })
  }, [prompts, searchQuery, selectedTag])

  const filteredPromptsRef = useRef(filteredPrompts)
  filteredPromptsRef.current = filteredPrompts

  useEffect(() => {
    setSelectedIndex(0)
    selectedIndexRef.current = 0
  }, [searchQuery])

  useEffect(() => {
    setSelectedIndex(0)
    selectedIndexRef.current = 0
  }, [selectedTag])

  useEffect(() => {
    if (isOpen) {
      setSelectedIndex(0)
      selectedIndexRef.current = 0
      setSelectedTag(null)
    }
  }, [isOpen])

  const handleSelectPrompt = (prompt: IPrompt) => {
    const input =
      activeInputRef.current ??
      findGeminiInput(document.activeElement) ??
      document.querySelector<HTMLElement>(GEMINI_INPUT_SELECTOR)
    if (input) {
      activeInputRef.current = input
      insertTextIntoGeminiInput(input, prompt.body)
    }
    setIsOpen(false)
  }

  if (!isOpen) {
    return null
  }

  const isDockedAbove = position.dockedAbove && position.bottom !== undefined
  const hasStateContent =
    isLoading ||
    !isAuthenticated ||
    Boolean(errorMessage) ||
    filteredPrompts.length === 0

  return (
    <div
      ref={popoverRef}
      className={`${css.popover} ${
        position.dockedAbove ? css.dockedAbove : css.dockedBelow
      }`}
      data-theme={theme}
      style={{
        left: `${position.left}px`,
        width: `${position.width}px`,
        ...(isDockedAbove
          ? { bottom: `${position.bottom}px` }
          : { top: `${position.top}px` })
      }}
      role="dialog"
      aria-label="PromptHub Gemini Prompts">
      <GeminiHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onRefresh={() => void refreshPrompts()}
        onClose={() => setIsOpen(false)}
        isLoading={isLoading}
      />

      {availableTags.length > 0 && (
        <div className={css.geminiTagFilterWrapper}>
          <TagFilter
            tags={availableTags}
            selectedTag={selectedTag}
            onSelectTag={setSelectedTag}
          />
        </div>
      )}

      {hasStateContent ? (
        <GeminiStateView
          isLoading={isLoading}
          isAuthenticated={isAuthenticated}
          errorMessage={errorMessage}
          totalPromptsCount={prompts.length}
        />
      ) : (
        <GeminiPromptList
          prompts={filteredPrompts}
          selectedIndex={selectedIndex}
          onSelectPrompt={handleSelectPrompt}
          onHoverIndex={setSelectedIndex}
          listRef={listRef}
        />
      )}
    </div>
  )
}

export const GeminiPromptsOverlay: React.FC = () => {
  const [queryClient] = useState(() => createDefaultQueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      <GeminiPromptsOverlayContent />
    </QueryClientProvider>
  )
}

export default GeminiPromptsOverlay
